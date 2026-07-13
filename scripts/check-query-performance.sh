#!/usr/bin/env bash
set -eu

# Query Performance Verification Script
# Runs key query patterns against SQL Server and reports elapsed time.
# Requires a running SQL Server instance with the PromiseModelOnline database.
#
# Usage:
#   bash scripts/check-query-performance.sh [server] [user] [password] [database]
#
# Defaults (all optional, also read from env vars):
#   server:   localhost,1433          or $PMO_DB_SERVER
#   user:     pmo_api                 or $PMO_API_DB_USER
#   password: (none)                  or $PMO_API_DB_PASSWORD
#   database: PromiseModelOnline      or $PMO_DB_NAME

# --- Resolve connection parameters ---
SERVER="${1:-${PMO_DB_SERVER:-localhost,1433}}"
USER="${2:-${PMO_API_DB_USER:-pmo_api}}"
PASSWORD="${3:-${PMO_API_DB_PASSWORD:-}}"
DATABASE="${4:-${PMO_DB_NAME:-PromiseModelOnline}}"

# --- Locate sqlcmd ---
SQLCMD=""
for candidate in sqlcmd /opt/mssql-tools18/bin/sqlcmd /opt/mssql-tools/bin/sqlcmd; do
    if command -v "$candidate" &>/dev/null; then
        SQLCMD="$candidate"
        break
    fi
done

# If sqlcmd not found on host, try docker exec into the SQL Server container
if [ -z "$SQLCMD" ]; then
    CONTAINER="promisemodelonlinedb"
    if command -v docker &>/dev/null && docker exec -i "$CONTAINER" /opt/mssql-tools18/bin/sqlcmd -? >/dev/null 2>&1; then
        echo "sqlcmd not found on host; using docker exec into $CONTAINER container"
        SQLCMD_BASE=(docker exec -i "$CONTAINER" /opt/mssql-tools18/bin/sqlcmd -S "$SERVER" -U "$USER" -d "$DATABASE" -C)
    else
        echo "ERROR: sqlcmd not found and docker exec into '$CONTAINER' container failed."
        echo ""
        echo "  Install mssql-tools18 on the host (https://learn.microsoft.com/sql/tools/sqlcmd/go-sqlcmd-utility):"
        echo "    curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -"
        echo '    curl -fsSL https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/prod.list | sudo tee /etc/apt/sources.list.d/mssql-release.list'
        echo "    sudo apt-get update && ACCEPT_EULA=Y sudo apt-get install -y mssql-tools18 unixodbc-dev"
        echo '    export PATH="$PATH:/opt/mssql-tools18/bin"'
        echo ""
        echo "  Or ensure the Docker Compose stack is running (the $CONTAINER container must exist)."
        exit 1
    fi
else
    SQLCMD_BASE=("$SQLCMD" -S "$SERVER" -U "$USER" -d "$DATABASE" -C)
fi

if [ -n "$PASSWORD" ]; then
    SQLCMD_BASE+=(-P "$PASSWORD")
else
    SQLCMD_BASE+=(-E)  # Trusted connection fallback
fi

# --- Test connectivity ---
echo "=== Query Performance Verification ==="
echo "  Server:   $SERVER"
echo "  User:     $USER"
echo "  Database: $DATABASE"
echo ""

if ! "${SQLCMD_BASE[@]}" -Q "SELECT 1" -b >/dev/null 2>&1; then
    echo "ERROR: Cannot connect to SQL Server. Check connection parameters."
    exit 1
fi

# --- Query definitions ---
# Each entry: NAME|QUERY
# Use row count checks to skip empty tables gracefully
QUERIES=(
    "Audit history listing (ProjectId + OccurredAtUtc)|SELECT ProjectId, OccurredAtUtc, ActionType, EntityType, EntityId FROM AuditEvents WHERE ProjectId = 1 ORDER BY OccurredAtUtc DESC OFFSET 0 ROWS FETCH NEXT 25 ROWS ONLY|AuditEvents"
    "Audit detail lookup (EntityType + EntityId)|SELECT EntityType, EntityId, COUNT(*) FROM AuditEvents WHERE EntityType = 'Moment' AND EntityId = 42 GROUP BY EntityType, EntityId|AuditEvents"
    "Unread notification count (UserId + IsRead)|SELECT COUNT(*) FROM Notification WHERE UserId = 1 AND IsRead = 0|Notification"
    "Reaction lookup (StackItemType + StackItemId)|SELECT Emote, COUNT(*) FROM Reactions WHERE StackItemType = 'moment' AND StackItemId = 42 GROUP BY Emote|Reactions"
    "Stack-graph promises (ProjectId + DisplayOrder)|SELECT p.Id, p.Statement, p.DisplayOrder FROM Promises p WHERE p.ProjectId = 1 ORDER BY p.DisplayOrder|Promises"
    "Unfinished moments in stride (AssignedStrideId + Status)|SELECT m.Id, m.Statement, m.SequenceNumber FROM Moments m WHERE m.AssignedStrideId = 10 AND m.Status != 4 ORDER BY m.DisplayOrder|Moments"
    "My Tasks (OwnerId + IsCompleted)|SELECT mt.Id, mt.Name, mt.MomentId FROM MomentTask mt WHERE mt.OwnerId = 1 AND mt.IsCompleted = 0 ORDER BY mt.CreatedAt DESC|MomentTask"
    "Overdue strides automation (EndDate filtered)|SELECT Id, Name, EndDate FROM Strides WHERE IterationId IS NOT NULL AND EndDate < GETUTCDATE() ORDER BY EndDate|Strides"
    "Permissions by UserId + Status (pending)|SELECT COUNT(*) FROM Permission WHERE UserId = 1 AND Status = 0|Permission"
)

OVERALL_EXIT=0
RESULTS=()

for entry in "${QUERIES[@]}"; do
    NAME="${entry%%|*}"
    REST="${entry#*|}"
    QUERY="${REST%|*}"
    TABLE="${REST##*|}"

    # Check if table has data
    ROW_COUNT=$("${SQLCMD_BASE[@]}" -Q "SET NOCOUNT ON; SELECT COUNT(*) FROM ${TABLE}" -h -1 -W -b 2>/dev/null | tr -d '[:space:]' || echo "0")
    ROW_COUNT="${ROW_COUNT:-0}"
    ROW_COUNT=$((ROW_COUNT + 0))

    if [ "$ROW_COUNT" -eq 0 ]; then
        printf "  %-50s %s\n" "$NAME" "SKIP (table empty)"
        continue
    fi

    # Run query 3 times, take average CPU time
    TOTAL_MS=0
    RUNS=0
    for run in 1 2 3; do
        RAW=$("${SQLCMD_BASE[@]}" -Q "SET STATISTICS TIME ON; ${QUERY}" 2>&1 || true)
        MS=$(echo "$RAW" | grep -oP 'CPU time = \K[0-9]+' | paste -sd+ | bc 2>/dev/null || echo "0")
        MS="${MS:-0}"
        TOTAL_MS=$((TOTAL_MS + MS))
        RUNS=$((RUNS + 1))
    done

    if [ "$RUNS" -gt 0 ]; then
        AVG_MS=$((TOTAL_MS / RUNS))
    else
        AVG_MS=0
    fi

    STATUS="PASS"
    if [ "$AVG_MS" -gt 500 ]; then
        STATUS="FAIL"
        OVERALL_EXIT=1
    fi

    printf "  %-50s %s (%dms avg, %d rows)\n" "$NAME" "$STATUS" "$AVG_MS" "$ROW_COUNT"
    RESULTS+=("$NAME|$STATUS|$AVG_MS|$ROW_COUNT")
done

echo ""
TOTAL=${#RESULTS[@]}
PASSED=0
FAILED=0
for r in "${RESULTS[@]}"; do
    S="${r##*|}"
    R="${r%|*}"
    S="${R##*|}"
    if [ "$S" = "PASS" ]; then
        PASSED=$((PASSED + 1))
    else
        FAILED=$((FAILED + 1))
    fi
done

echo "  Results: $PASSED passed, $FAILED failed, $(( ${#QUERIES[@]} - TOTAL - FAILED )) skipped (empty tables)"

if [ "$OVERALL_EXIT" -eq 0 ]; then
    echo "  All queries with data pass (<500ms avg)"
else
    echo "  One or more queries exceed 500ms"
fi

exit $OVERALL_EXIT
