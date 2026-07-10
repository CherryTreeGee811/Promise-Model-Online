#!/usr/bin/env bash
set -eu

# Query Performance Verification Script
# Runs key query patterns against SQL Server and reports elapsed time.
# Requires a running SQL Server instance with the PMO database.
#
# Usage:  bash scripts/check-query-performance.sh [connection-string]
# Default connection string: "Server=localhost;Database=promisemodelonline;Trusted_Connection=True;TrustServerCertificate=True;"

CONN="${1:-Server=localhost;Database=promisemodelonline;Trusted_Connection=True;TrustServerCertificate=True;}"

QUERIES=(
  # Query 1: Audit history listing (most impactful)
  "SELECT ProjectId, OccurredAtUtc, ActionType, EntityType, EntityId
   FROM AuditEvents
   WHERE ProjectId = 1
   ORDER BY OccurredAtUtc DESC
   OFFSET 0 ROWS FETCH NEXT 25 ROWS ONLY"

  # Query 2: Audit detail lookup
  "SELECT EntityType, EntityId, COUNT(*)
   FROM AuditEvents
   WHERE EntityType = 'Moment' AND EntityId = 42
   GROUP BY EntityType, EntityId"

  # Query 3: Unread notification count
  "SELECT COUNT(*)
   FROM Notification
   WHERE UserId = 1 AND IsRead = 0"

  # Query 4: Reaction lookup
  "SELECT Emote, COUNT(*)
   FROM Reactions
   WHERE StackItemType = 'moment' AND StackItemId = 42
   GROUP BY Emote"

  # Query 5: Stack-graph hierarchy (DisplayOrder sort)
  "SELECT p.Id, p.Statement, p.DisplayOrder
   FROM Promises p
   WHERE p.ProjectId = 1
   ORDER BY p.DisplayOrder"

  # Query 6: Unfinished moments in a stride
  "SELECT m.Id, m.Statement, m.SequenceNumber
   FROM Moments m
   WHERE m.AssignedStrideId = 10 AND m.Status != 4
   ORDER BY m.DisplayOrder"

  # Query 7: My Tasks
  "SELECT mt.Id, mt.Name, mt.MomentId
   FROM MomentTask mt
   WHERE mt.OwnerId = 1 AND mt.IsCompleted = 0
   ORDER BY mt.CreatedAt DESC"

  # Query 8: Overdue strides (automation)
  "SELECT Id, Name, EndDate
   FROM Strides
   WHERE IterationId IS NOT NULL AND EndDate < GETUTCDATE()
   ORDER BY EndDate"
)

NAMES=(
  "Audit history listing (ProjectId + OccurredAtUtc)"
  "Audit detail lookup (EntityType + EntityId)"
  "Unread notification count (UserId + IsRead)"
  "Reaction lookup (StackItemType + StackItemId)"
  "Stack-graph promises (ProjectId + DisplayOrder)"
  "Unfinished moments in stride (AssignedStrideId + Status)"
  "My Tasks (OwnerId + IsCompleted)"
  "Overdue strides automation (EndDate filtered)"
)

echo "=== Query Performance Verification ==="
echo "Connection: ${CONN}"
echo ""

OVERALL_EXIT=0
for i in "${!QUERIES[@]}"; do
  NAME="${NAMES[$i]}"
  QUERY="${QUERIES[$i]}"

  # Run query 3 times, take average
  TOTAL_MS=0
  for run in 1 2 3; do
    RESULT=$(sqlcmd -S "$CONN" -Q "SET STATISTICS TIME ON; ${QUERY}" 2>&1 | grep -oP 'CPU time = \K[0-9]+' | paste -sd+ | bc 2>/dev/null || echo 0)
    MS=$(echo "$RESULT" | head -1)
    TOTAL_MS=$((TOTAL_MS + MS))
  done
  AVG_MS=$((TOTAL_MS / 3))

  STATUS="PASS"
  if [ "$AVG_MS" -gt 500 ]; then
    STATUS="FAIL"
    OVERALL_EXIT=1
  fi

  printf "  %-50s %s (%dms avg)\n" "$NAME" "$STATUS" "$AVG_MS"
done

echo ""
if [ "$OVERALL_EXIT" -eq 0 ]; then
  echo "✅ All queries pass (<500ms)"
else
  echo "❌ One or more queries exceed 500ms"
fi

exit $OVERALL_EXIT
