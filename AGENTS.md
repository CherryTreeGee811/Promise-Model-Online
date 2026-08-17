<!-- CODEGRAPH_START -->
## CodeGraph

In repositories indexed by CodeGraph (a `.codegraph/` directory exists at the repo root), reach for it BEFORE grep/find or reading files when you need to understand or locate code:

- **MCP tool** (when available): `codegraph_explore` answers most code questions in one call — the relevant symbols' verbatim source plus the call paths between them, including dynamic-dispatch hops grep can't follow. Name a file or symbol in the query to read its current line-numbered source. If it's listed but deferred, load it by name via tool search.
- **Shell** (always works): `codegraph explore "<symbol names or question>"` prints the same output.

If there is no `.codegraph/` directory, skip CodeGraph entirely — indexing is the user's decision.
<!-- CODEGRAPH_END -->

## Database Schema — Index Inventory

### Hierarchy (Project → Promise → Epic → Journey → Flow → Moment → Task)

All FK columns have indexes (auto-created by EF Core). Additional covering indexes added in migration `AddMissingPerformanceIndexes`:

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| Promises | `IX_Promises_ProjectId_DisplayOrder` | ProjectId, DisplayOrder | Stack-graph sort |
| Epics | `IX_Epics_ProductPromiseId_DisplayOrder` | ProductPromiseId, DisplayOrder | Stack-graph sort |
| Journeys | `IX_Journeys_EpicId_DisplayOrder` | EpicId, DisplayOrder | Stack-graph sort |
| Flows | `IX_Flows_JourneyId_DisplayOrder` | JourneyId, DisplayOrder | Stack-graph sort |
| Moments | `IX_Moments_AssignedStrideId_Status` | AssignedStrideId, Status | Stride board filter |

### AuditEvents (no indexes existed prior to migration)

| Index | Columns | Query Pattern |
|-------|---------|---------------|
| `IX_AuditEvents_ProjectId_OccurredAtUtc` | ProjectId, OccurredAtUtc | History listing |
| `IX_AuditEvents_EntityType_EntityId` | EntityType, EntityId | Detail modal lookup |

### Permissions

| Index | Columns | Query Pattern |
|-------|---------|---------------|
| `IX_Permission_UserId_Status` | UserId, Status | Pending invitations, active project IDs |

### Notifications, Reactions

| Table | Index | Columns | Query Pattern |
|-------|-------|---------|---------------|
| Notification | `IX_Notification_UserId_IsRead` | UserId, IsRead | Unread badge count |
| Reactions | `IX_Reactions_StackItemType_StackItemId` | StackItemType, StackItemId | Polymorphic reaction display |

### Task Queries

| Table | Index | Columns | Query Pattern |
|-------|-------|---------|---------------|
| MomentTask | `IX_MomentTask_OwnerId_IsCompleted` | OwnerId, IsCompleted | My Tasks page |
| BugReworkTask | `IX_BugReworkTask_SourceCommentId` | SourceCommentId | Bug rework lookup |

### Automation

| Table | Index | Columns | Filter | Query Pattern |
|-------|-------|---------|--------|---------------|
| Strides | `IX_Strides_EndDate` | EndDate | `WHERE IterationId IS NOT NULL` | Overdue stride detection |

### Migration

- Name: `AddMissingPerformanceIndexes`
- Timestamp: `20260713033412`
- DDL only — no schema changes, no data movement

### CI Verification

- **Script**: `scripts/check-query-performance.sh` — runs every query 3×, averages CPU time, fails if >500ms
- **Trigger**: Runs automatically in CI (`BuildAndTest.yml`) after E2E core tests, before OWASP ZAP
- **Credentials**: Uses `pmo_api` user with password from `${{ secrets.PMO_API_DB_PASSWORD }}`
- **sqlcmd**: Installed on CI runner via `mssql-tools18` Ubuntu package
- **Empty tables**: Skipped gracefully with a `SKIP (table empty)` message

### Notes

- `IX_BugReworkTask_SourceCommentId` is an EF Core auto-generated FK index from the initial migration, NOT added by `AddMissingPerformanceIndexes`.
- `IX_Moments_OwnerId` likewise exists as an auto-generated FK index from the initial migration.

## E2E Session Refresh

### Problem
`ViewUser_CannotCreateStride` flakes because pre-captured session cookies (stored in `GlobalSetUp.OwnerSessionChunks` / `SecondUserSessionChunks`) expire during a long test run. By the time the 13th test executes, the injected cookies are stale, so API calls via `SendWithSessionCookieAsync` return 401 instead of `Forbidden`.

### Fix
`ValidateAndRefreshSessionAsync` in `E2ETestBase.cs` runs after cookie injection:
1. Navigates to `BaseUrl` with `WaitUntilState.DOMContentLoaded`
2. If the URL matches the login page pattern (`account/login|connect/authorize`), the session has expired
3. Falls back to a full browser `LoginAsUser` which captures fresh cookies
4. Updates the global `GlobalSetUp` static chunks so subsequent tests benefit from the refresh

### Files
- `E2ETestBase.cs:195-214` — validation + refresh methods
- `E2ETestBase.cs:154-193` — `LoginAsync` / `LoginAsSecondUserAsync` call validation after injection
- `GlobalSetUp.cs:14-25` — `RefreshOwnerSession` / `RefreshSecondUserSession` setter methods

### Regression: `ViewUser_CannotCreateJourney` flake

`ValidateAndRefreshSessionAsync` revealed a latent issue in the initial `GotoAsync(BaseUrl)` inside `LoginAsync`/`LoginAsSecondUserAsync`. The original catch only matched `ERR_ABORTED`, but Playwright can also throw "interrupted by another navigation" when the SPA's client-side auth redirect fires before the `load` event.

**Fix (2026-07-13):**
- Changed `WaitUntilState.Load → DOMContentLoaded` so GotoAsync returns before the SPA's async redirect
- Widened all `catch (PlaywrightException ex) when (...)` to `catch (PlaywrightException)` for both initial and validation navigations
- `E2ETestBase.cs:158-164`, `181-187`, `213-218`

## OIDC Audience Mismatch (2026-07-24)

### Problem
Login flow succeeded (OIDC callback returns 302, BFF session cookie set) but `/api/users/me` returned 401 with:
```
www-authenticate: Bearer error="invalid_token", error_description="The audience '(null)' is invalid"
```

### Root Cause
The auth service hardcoded `promisemodelonline.api` (dot) as the access token audience via `SetResources()` in `AuthorizationController.cs:100`, but the production API expects `promisemodelonline-api` (dash). The audience claim in the issued token didn't match the API's `ValidAudience`.

### Fix
1. **`PromiseModelOnline.Auth/Controllers/AuthorizationController.cs:102-106`** — Audience is now read from `configuration["Auth:AccessTokenAudience"]` with fallback to `"promisemodelonline.api"` for backward compatibility. `IConfiguration` injected via primary constructor.
2. **`deploy/docker-stack.yml:149`** — Added `Auth__AccessTokenAudience=promisemodelonline-api` to auth service env vars to match the API's `JwtSettings__Audience=promisemodelonline-api`.
3. **`deploy/docker-compose.yml:131`** — Same change for Compose-based production deployment.
4. **`docker-compose.yml:131`** — Dev compose uses `promisemodelonline.api` (matching dev API audience).

### Deploy
Rebuild auth image, push to DockerHub, then update stack:
```bash
docker push cherrytree811/promisemodelonlineauth
docker service update --image cherrytree811/promisemodelonlineauth promisemodelonline_promisemodelonline-auth
```

### Verification
Run full login flow via curl/Python and check `/api/users/me` returns 200 with user data:
```python
# Follow /login -> authorize -> login form POST -> signin-oidc callback
# Then GET /api/users/me with session cookies
```

## Local CI with `act` (run the full `BuildAndTest` pipeline locally)

### Command
```bash
act -W .github/workflows/BuildAndTest.yml --secret-file .secrets --pull=false
```

The pipeline is designed to run **within a container**: act maps `runs-on: ubuntu-latest` to the `catthehacker/ubuntu:act-latest` runner image (`~/.config/act/actrc` has `-P ubuntu-latest=catthehacker/ubuntu:act-latest`), so every job step executes inside that container, never on the host. `--bind` mounts the host working dir into it, and the Docker socket is mounted so nested `docker compose` steps work.

### Secrets
- **On GitHub**: secrets are managed in repo settings (Settings → Secrets and variables → Actions), never committed.
- **Locally**: `.secrets` (repo root, **gitignored**) holds the same values for `act`. The workflow's `--secret-file` reads them and the "Write secrets" step writes them into `secrets/*.txt`, which the compose stack mounts as Docker secrets. Populate `.secrets` from the GitHub repo settings values; a template is generated on first use.
- `.env` (repo root, gitignored) holds the **non-secret** config vars that `docker compose` interpolates via `${VAR}` substitution (compose auto-reads `.env`).

### Prerequisites
- Docker — use **native `dockerd`**, NOT the Docker Desktop context. Switch with `docker context use default`; start the daemon with `sudo systemctl start docker`. Docker Desktop's FUSE mount cannot delete root-owned files and its VM complicates the compose network for the E2E stack.
- `act` v0.2.70+
- First run: `--pull=true` to fetch the ~18 GB runner image; subsequent runs `--pull=false`.
- Generate dev certs: `bash scripts/generate-dev-certs.sh` (writes `secrets/cert_password.txt`).

### Gotchas
- `act --bind` runs as root → regenerates **root-owned artifacts** each run (`bin/obj`, `dist`, `chrome/`, test-result dirs). Clean up before re-running using a native-dockerd root container, then restore `dist`:
  ```bash
  docker run --rm -v "$(pwd):/repo" alpine rm -rf /repo/chrome /repo/dist /repo/coverage /repo/*TestResults /repo/*/bin /repo/*/obj
  git checkout -- PromiseModelOnline.Client/wwwroot/dist/
  ```
- Use `--action-offline-mode` to avoid re-cloning actions, and `-p=false` to avoid unnecessary pulls.
- Steps gated on `if: env.ACT != 'true'` (Codecov upload, Trivy SARIF upload, Docker Hub push) are skipped locally and pass silently.
- The lockfile is npm 11-generated — do not regenerate with npm 10/12.

### E2E stack stall history (root cause + fix)
- **Symptom**: GitHub CI stalled ~5 h at "Start E2E Stack" — `db-init` looped "Waiting for SQL Server..." forever.
- **Root cause**: the SQL Server 2025 image **ignores `MSSQL_SA_PASSWORD_FILE`** — its `mssql-conf` only reads `MSSQL_SA_PASSWORD`, so SA was never configured.
- **Fix**: `scripts/db-entrypoint.sh` reads `/run/secrets/db_sa_password` and exports `MSSQL_SA_PASSWORD` before launching. Applied via `docker-compose.yml` and `deploy/docker-stack.yml`, both of which also set `command: ["/opt/mssql/bin/sqlservr"]` (overriding the entrypoint drops the image's Cmd).
- **Related fixes**: cert-password mismatch (workflow passes `CERT_PASSWORD` into `generate-dev-certs.sh`, which writes the password file it actually used) and Hadolint numeric-UID/JSON-CMD fixes across all 5 Dockerfiles.
- Verified locally end-to-end: 233 steps, 0 failures, `🏁 Job succeeded`.

## Staging Deployment (`deploy/deploy.sh` — Ansible + QEMU/KVM + Docker Swarm)

Staging/prod is deployed **manually** to a QEMU/KVM VM on this host (never via CI). Entry point: `deploy/deploy.sh` → runs `ansible/playbooks/site.yml` (provision VM, then deploy stack).

### What `deploy.sh` does
1. Prereq check: `virsh`, `virt-install`, `qemu-img`, `xorrisofs`, `ansible`, `rsync`; verifies `libvirtd` active + default network active.
2. Generates `~/.ssh/pmo_vm_key` (ed25519) if missing.
3. Runs `deploy/scripts/generate-secrets.sh` — **always regenerates** auto-secrets (DB passwords, cert password, auth registration key) + auth PFX; keeps the 4 external secrets if non-placeholder; regenerates certs only if <24h before expiry.
4. Validates external secrets (`google_client_secret.txt`, `sendgrid_api_key.txt`, `cloudflare_tunnel_token.txt`, `github_token.txt`) — continues with warning if placeholders.
5. Runs Ansible `site.yml`.

### VM + playbooks
- VM: `pmo-vm`, 4 vCPU / 4GB / 40GB qcow2, IP `192.168.122.50` (libvirt `default` net, NAT), Ubuntu 24.04 cloud image. `ansible/inventory/hosts.yml` has `host_machine` (localhost, connection=local) + `vm_host` groups.
- `provision-vm.yml`: **destroys + recreates the VM every run** (deletes existing domain, recreates from cached `cloudimg.qcow2`). Cloud-init installs `docker.io`, `docker-compose-v2`, `qemu-guest-agent`; injects `~/.ssh/pmo_vm_key.pub` for `pmo_admin`.
- `deploy-stack.yml`: waits for cloud-init, syncs `deploy/` to `/home/pmo_admin/promise-model-online`, writes secrets, creates Swarm secrets + certs, `docker pull`s the 5 `cherrytree811/*` images, `docker stack deploy`, waits for stability.
- Others: `update-stack.yml` (force-update `:latest`), `rollback-stack.yml` (SHA-pinned, per-service `service_override`), `destroy-stack.yml`.

### Cloudflare Tunnel — read the playbook, don't guess
- `cloudflared` is in `docker-stack.yml` (service `cloudflared`) and `deploy/docker-compose.yml` (profile `production`). The VM makes only **outbound** connections to Cloudflare — no inbound port-forwarding needed.
- Two modes, auto-detected in `deploy-stack.yml` from `cloudflare_tunnel_token.txt` content:
  - **Quick Tunnel** (token file contains `REPLACE_ME`/`PLACEHOLDER`): playbook rewrites cloudflared command to `tunnel --url http://promisemodelonline-proxy:8080 --no-autoupdate`, extracts the `https://*.trycloudflare.com` URL from service logs, then patches auth/BFF `APP_BASE_URL`/`AUTH_PUBLIC_ISSUER`.
  - **Named Tunnel** (real token, a JWT starting `eyJ...`): uses `command: tunnel --no-autoupdate run` with `TUNNEL_TOKEN_FILE=/run/secrets/cloudflare_tunnel_token`; no URL extraction. Our `cloudflare_tunnel_token.txt` is a **real JWT** → named-tunnel mode.
- Deployment is gated on the VM having outbound internet.

### Host gotchas (learned the hard way)
- **UFW must allow libvirt NAT or the VM has no internet** (ICMP ping works, but TCP/UDP forwarded traffic is dropped → cloud-init can't install docker, `docker pull` fails, cloudflared can't connect). Fix:
  ```bash
  sudo ufw allow in on virbr0 && sudo ufw allow out on virbr0
  sudo sed -i 's/^#*DEFAULT_FORWARD_POLICY=.*/DEFAULT_FORWARD_POLICY="ACCEPT"/' /etc/default/ufw
  sudo ufw reload && sudo systemctl restart libvirtd
  ```
- `get_url` in `provision-vm.yml` fails with "Destination ... is not writable" if a previous run left `cloudimg.qcow2`/`vm.qcow2`/`cloudinit.iso` owned by `libvirt-qemu`. Since the playbook recreates the VM anyway, delete stale artifacts first (works because the `pmo-vm` dir is owned by the deploy user).
- `ssh-keyscan` last task in `provision-vm.yml` can transiently fail right after VM boot (SSH not ready); `wait_for` port-22 may pass before sshd accepts. Just re-run; the VM persists.
- When running the deploy in the background, use `setsid bash deploy.sh > log 2>&1 &` — a plain `&` can be reaped when the invoking shell/session exits.

### Deployment state (left off 2026-08-17, DEPLOY IN PROGRESS — not yet live)
- Host UFW was blocking libvirt NAT (kernel log: `[UFW BLOCK] IN=virbr0 OUT=wlan0 SRC=192.168.122.50 ...`) — **fixed** with `ufw allow in/out on virbr0` + `DEFAULT_FORWARD_POLICY="ACCEPT"` + `ufw reload` + `libvirtd restart`. VM now has full outbound internet (DNS, TCP 443, `apt-get update` verified).
- VM `pmo-vm` **was recreated and is running** (provision-vm succeeded). cloud-init initially errored on package install (was blocked by UFW) → manually installed `docker.io` (29.1.3), `docker-compose-v2` (2.40.3), `qemu-guest-agent` in the VM; docker enabled + active, pulls work.
- **Next step**: `ansible-playbook -i deploy/ansible/inventory/hosts.yml deploy/ansible/playbooks/deploy-stack.yml`. Was BLOCKED by two things to handle on resume:
  1. Stale `known_hosts` entry for `192.168.122.50` (VM was recreated → new host key). Fix: `ssh-keygen -R 192.168.122.50` (already done).
  2. First task "Wait for cloud-init to complete" fails hard because cloud-init is in `status: error` (packages were installed manually, but cloud-init still reports error). Fix: mark cloud-init done or reset before running deploy-stack — e.g. `sudo cloud-init status --wait` returns rc=1. Workaround: run `sudo cloud-init status --wait || true`, or `sudo cloud-init clean` then reboot, or edit the task in deploy-stack.yml.
- Priority was deprioritized to test production; staging is mid-deploy, not live.
