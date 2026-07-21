# deploy/ — Promise Model Online Production Deployment

Self-contained deployment package. No source code required.

## Layout

```
deploy/
├── .env                          # Production env vars (edit for your domain)
├── docker-stack.yml              # Docker Swarm stack definition
├── docker-compose.yml            # Single-host compose alternative
├── deploy-prod.sh                # One-command production deploy script
├── nginx-swarm.conf              # Swarm nginx config
├── nginx-swarm-default.conf      # Swarm nginx route definitions
├── ansible/
│   ├── inventory/
│   │   ├── hosts.yml             # VM connection config
│   │   └── group_vars/all.yml    # VM settings (disk, memory, IP)
│   └── playbooks/
│       ├── site.yml              # Provision + deploy
│       ├── provision-vm.yml      # QEMU/KVM VM creation
│       ├── deploy-stack.yml      # Cert gen + swarm deploy
│       └── destroy-stack.yml     # Teardown
├── scripts/
│   ├── generate-certs.sh         # Self-signed cert generation
│   ├── init-db.sh                # MSSQL database initialization
│   └── umami-init.sh             # Umami analytics initialization
└── secrets/                      # YOU POPULATE THESE
    └── .gitkeep
```

## Quick Start (Manual)

```bash
# 1. Populate secrets (see Secrets section below)
nano secrets/db_sa_password.txt
nano secrets/cloudflare_tunnel_token.txt
# ... all 10 secrets

# 2. Generate certificates
bash scripts/generate-certs.sh

# 3. Initialize Docker Swarm (if not already)
docker swarm init 2>/dev/null || true

# 4. Create Docker secrets
for s in db_sa_password api_db_password auth_db_password google_client_secret \
         sendgrid_api_key cert_password umami_db_password umami_admin_password \
         cloudflare_tunnel_token auth_registration_key; do
  [ -f "secrets/$s.txt" ] && docker secret create "pmo_$s" "secrets/$s.txt" 2>/dev/null || true
done

# 5. Deploy the stack
docker stack deploy -c docker-stack.yml promisemodelonline

# 6. Monitor
docker service ls --filter name=promisemodelonline
```

## Quick Start (Using deploy-prod.sh)

The script automates steps 2–5:

```bash
bash deploy-prod.sh
```

It will warn about missing secrets but continue with what it has.

## Secrets

Create these files in `secrets/` before deploying:

| File | Purpose |
|---|---|
| `db_sa_password.txt` | SQL Server SA password |
| `api_db_password.txt` | API database user password |
| `auth_db_password.txt` | Auth database user password |
| `google_client_secret.txt` | Google OAuth client secret |
| `sendgrid_api_key.txt` | SendGrid API key for emails |
| `cert_password.txt` | PFX certificate password |
| `umami_db_password.txt` | Umami Postgres password |
| `umami_admin_password.txt` | Umami admin password |
| `cloudflare_tunnel_token.txt` | Cloudflare tunnel token for promisemodel.online |
| `auth_registration_key.txt` | Auth registration key |

All passwords must be URL-safe (no special characters).

## Environment Variables

The file `.env` documents production values. These are read by `deploy-prod.sh` and the Ansible playbook. Key settings:

- `APP_BASE_URL=https://promisemodel.online` — change to your domain
- `AUTH_PUBLIC_ISSUER=https://promisemodel.online` — OpenID issuer (same as base URL)
- `AUTH_GOOGLE_CLIENT_ID` — Google OAuth client ID
- `UMAMI_WEBSITE_DOMAIN=promisemodel.online` — analytics tracking domain

## Deploying via Ansible

```bash
# From this directory:
ansible-playbook -i ansible/inventory/hosts.yml ansible/playbooks/deploy-stack.yml
```

The playbook syncs deploy files to the VM, generates certs, creates secrets, and deploys.

## Monitoring

```bash
docker service ls --filter name=promisemodelonline
docker stack ps promisemodelonline
docker service logs promisemodelonline_promisemodelonline-auth
```

## Architecture

```
Cloudflare Tunnel → Host:9000 → nginx-proxy (2 replicas)
                                 ├── /api/* /hubs/*        → bff:8010 (2 replicas)
                                 ├── /login /logout /oidc → bff:8010
                                 ├── /connect/* /.well-known/* → auth:8060 (2 replicas)
                                 ├── /account/* /signin-google  → auth:8060
                                 ├── /umami/*              → umami:3000
                                 ├── /* (static)           → client:4000 (2 replicas)
                                 └── /health               → nginx pid check
```

## Teardown

```bash
docker stack rm promisemodelonline
docker swarm leave --force
```
