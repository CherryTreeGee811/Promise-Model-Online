# Promise Model Online

Enterprise project-management SaaS platform built on ASP.NET Core 10 with OpenID Connect (OpenIddict) and OAuth 2.1 / OIDC-compliant authentication.

---

## Architecture

```mermaid
graph TB
    subgraph Browser["Browser / SPA"]
        SPA["Vanilla JS SPA<br/>(localhost:9000)"]
    end

    subgraph Docker["Docker Compose Network"]
        NGINX["nginx (:9000)<br/>Static files + Reverse proxy"]

        subgraph BFF["Backend-for-Frontend"]
            BFF_SVC["YARP Reverse Proxy<br/>OIDC Client (cookie)<br/>(:8010)"]
        end

        subgraph API["API Layer"]
            API_SVC["REST API<br/>JWT Bearer Auth<br/>ASP.NET Core 10<br/>(:8000)"]
        end

        subgraph Auth["Auth Layer"]
            AUTH_SVC["Identity Provider<br/>OpenIddict + Identity<br/>ASP.NET Core 10<br/>(:8060)"]
        end

        subgraph Storage["Data Layer"]
            SQL["SQL Server 2025<br/>(:1433)"]
        end
    end

    subgraph External["External Providers"]
        GOOGLE["Google OAuth 2.1"]
    end

    SPA -- "static assets" --> NGINX
    SPA -- "API calls /api/*" --> NGINX
    NGINX -- "/api/ /hubs/" --> BFF_SVC
    NGINX -- "/connect/* /.well-known/* /signin-google" --> AUTH_SVC
    NGINX -- "/login /logout" --> BFF_SVC
    BFF_SVC -- "backchannel: metadata, token" --> AUTH_SVC
    BFF_SVC -- "Bearer token" --> API_SVC
    AUTH_SVC -- "EF Core" --> SQL
    API_SVC -- "EF Core" --> SQL

    Browser -. "browser redirects to /connect/authorize" .-> NGINX
    Browser -. "browser redirects to Google" .-> GOOGLE
    GOOGLE -. "browser redirects to /signin-google" .-> NGINX
    AUTH_SVC -. "backchannel: token + userinfo" .-> GOOGLE
```

---

## Authentication Flow

```mermaid
sequenceDiagram
    participant User as Browser
    participant Nginx as nginx (:9000)
    participant BFF as BFF (:8010)
    participant Auth as Auth Server (:8060)
    participant API as API Server (:8000)
    participant Google as Google

    Note over User,Google: Internal Login
    User->>Nginx: GET /login
    Nginx->>BFF: proxy
    BFF->>User: 302 redirect to /connect/authorize
    User->>Nginx: GET /connect/authorize
    Nginx->>Auth: proxy
    Auth->>User: Login form
    User->>Nginx: POST username/password
    Nginx->>Auth: proxy
    Auth->>Auth: SignInManager validates
    Auth->>Auth: Issues Identity cookie
    Auth->>Nginx: 302 redirect with code
    Nginx->>User: redirect
    User->>Nginx: GET /signin-oidc?code=...
    Nginx->>BFF: proxy
    BFF->>Auth: backchannel: code + PKCE → tokens
    BFF->>User: Sets session cookie
    User->>Nginx: GET /api/users/me (with cookie)
    Nginx->>BFF: proxy
    BFF->>API: Bearer token
    API->>BFF: { id, name, email }
    BFF->>User: Response

    Note over User,Google: External Login (Google)
    User->>Nginx: POST /account/external/challenge
    Nginx->>Auth: proxy
    Auth->>User: 302 redirect to Google
    User->>Google: Authenticate
    Google->>Nginx: 302 redirect to /signin-google?code=...
    Nginx->>Auth: proxy
    Auth->>Google: backchannel: code + secret → tokens + userinfo
    Auth->>Auth: Create/link IdentityUser
    Auth->>User: 302 redirect to returnUrl
    User->>Nginx: GET /signin-oidc?code=...
    Nginx->>BFF: proxy
    BFF->>Auth: backchannel: code + PKCE → tokens
    BFF->>User: Sets session cookie
```

---

## Authentication Flow

```mermaid
sequenceDiagram
    participant User as Browser
    participant BFF as BFF (YARP)
    participant Auth as Auth Server
    participant API as API Server
    participant Google as Google (Optional)

    Note over User,Google: Internal Login
    User->>BFF: GET /login
    BFF->>Auth: OIDC authorize (via nginx)
    Auth->>User: Login form (username/password)
    User->>Auth: POST credentials
    Auth->>Auth: SignInManager validates
    Auth->>Auth: Issues Identity cookie
    Auth->>BFF: Authorization code
    BFF->>Auth: Code + PKCE → tokens
    BFF->>User: Sets session cookie
    User->>BFF: API request (with cookie)
    BFF->>API: Bearer token (from session)
    API->>API: Validates JWT via OIDC metadata
    API->>BFF: Response
    BFF->>User: Response

    Note over User,Google: External Login (Google)
    User->>Auth: Click "Sign in with Google"
    Auth->>Google: OAuth 2.1 challenge + PKCE
    Google->>User: Google login page
    User->>Google: Authenticate
    Google->>NGINX: Redirect to /signin-google
    NGINX->>Auth: Proxy to Auth server
    Auth->>Google: Code + secret → tokens + userinfo
    Auth->>Auth: Create/link IdentityUser
    Auth->>Auth: Issues Identity cookie
    Auth->>BFF: Authorization code
    BFF->>Auth: Code + PKCE → tokens
    BFF->>User: Sets session cookie
```

---

## Services

| Service | Container | Port | Framework | Purpose |
|---|---|---|---|---|
| **Client** | `promisemodelonlineclient` | `:9000` | nginx + Vanilla JS | SPA static file server, reverse proxy |
| **BFF** | `promisemodelonlinebff` | `:8010` | ASP.NET Core 10 + YARP | OIDC client + reverse proxy |
| **Auth** | `promisemodelonlineauth` | `:8060` | ASP.NET Core 10 + OpenIddict | OIDC identity provider |
| **API** | `promisemodelonlineapi` | `:8000` | ASP.NET Core 10 | Resource server |
| **DB** | `promisemodelonlinedb` | `:1433` | SQL Server 2025 | Persistent storage |

---

## Authentication Standards

- **OAuth 2.1** — Authorization code flow with PKCE; no implicit grant; confidential clients only
- **OpenID Connect** — Standardized ID tokens, UserInfo endpoint, `openid` scope enforcement
- **External Provider** — Google OAuth 2.1 (optional, enabled when `AUTH_GOOGLE_CLIENT_ID` is set)

### Token Lifetimes

| Token | Lifetime |
|---|---|
| Authorization code | 10 minutes |
| Access token | 15 minutes |
| Refresh token | 7 days |

---

## Getting Started

### Prerequisites

- .NET 10.0 SDK
- Docker Desktop (or Docker Compose)
- OpenSSL (for generating secrets)

### 1. Clone and build

```bash
git clone <repo-url>
cd Promise-Model-Online
dotnet restore
dotnet build
```

### 2. Generate secrets

```bash
mkdir -p secrets

# Database passwords (URL-safe, no special chars)
openssl rand -base64 24 | tr '+/' '-_' | tee secrets/auth_db_password.txt
openssl rand -base64 24 | tr '+/' '-_' | tee secrets/api_db_password.txt

# Google OAuth (paste from Google Cloud Console — not generated via OpenSSL)
# echo 'your-client-secret' > secrets/google_client_secret.txt
```

> **Note:** Only `secrets/*.txt` files are gitignored. Example templates (`.example.txt`) are committed for documentation.

### 3. Configure environment

Set the public Google client ID in your environment:

```bash
export AUTH_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

Register the redirect URI in Google Cloud Console (**port 9000 — through nginx**):
```
https://localhost:9000/signin-google
```

### 4. Run

```bash
docker compose up --build
```

The application is available at `https://localhost:9000`.

---

## Secret Management

Secrets are stored as files in `./secrets/` and mounted into containers as Docker secrets at `/run/secrets/<name>`. They are **never** set as environment variable values in `docker-compose.yml`.

| Secret | File | Used By |
|---|---|---|
| Auth DB password | `secrets/auth_db_password.txt` | Auth connection string |
| API DB password | `secrets/api_db_password.txt` | API connection string |
| Google client secret | `secrets/google_client_secret.txt` | Auth (Google OAuth) |

**Non-secrets** (plain environment variables):
- `AUTH_GOOGLE_CLIENT_ID` — public OAuth identifier
- `PMO_API_DB_USER`, `PMO_AUTH_DB_USER` — database usernames
- `AUTH__REG_KEY` — registration key (optional, Swagger only)
- `JWT__KEY` — JWT key (unused, reserved)

**Resolution order** for DB passwords (via `ConnectionStringExtensions.ResolveSecrets()`):
1. The connection string contains `Password_FILE=/run/secrets/<name>`
2. `ResolveSecrets()` reads the file at that path
3. If the file doesn't exist or is empty → throws `InvalidOperationException` (fail-fast)

---

## Development

### Running without Docker

```bash
# For non-Docker dev, set secrets as environment variables:
export AUTH_GOOGLE_CLIENT_ID=...
export AUTH_GOOGLE_CLIENT_SECRET=...
export PMO_AUTH_DB_PASSWORD=...
export PMO_API_DB_PASSWORD=...

# Auth server
dotnet run --project PromiseModelOnline.Auth

# API server
dotnet run --project PromiseModelOnline.Api

# BFF
dotnet run --project PromiseModelOnline.BFF
```

### Testing

```bash
dotnet test PromiseModelOnline.Auth.Tests
dotnet test PromiseModelOnline.Api.Tests
```

### CI/CD Pipeline

The project uses GitHub Actions for CI/CD. Pipelines run on every push:

1. **Build** — `dotnet build --configuration Release`
2. **Unit tests** — Auth, API, and Client test suites (NUnit + Selenium)
3. **Integration tests** — Auth integration tests against a real database
4. **Smoke test** — Full `docker compose up` with health checks for all 6 services
5. **Push** — Images tagged `latest` and pushed to Docker Hub (main branch only)

Secrets are injected at runtime via GitHub Secrets, never baked into images.

---

## Project Structure

```
Promise-Model-Online/
├── PromiseModelOnline.Auth/        # OpenIddict identity provider
│   ├── Controllers/                # Login, Authorization, ExternalLogin
│   ├── Extensions/                 # OpenIddict config, connection string resolvers
│   ├── Middleware/                 # Forwarded headers, security headers
│   ├── Views/                      # Razor login/register pages
│   └── wwwroot/                    # Auth server CSS/JS
├── PromiseModelOnline.Api/         # REST API resource server
│   ├── BusinessLogic/              # Domain services, automation
│   ├── Controllers/                # API endpoints
│   ├── DAL/                        # EF Core DbContext, repositories
│   └── Extensions/                 # DI registration, seeders, connection string resolvers
├── PromiseModelOnline.BFF/         # YARP reverse proxy + OIDC client
├── PromiseModelOnline.Client/      # nginx + Vanilla JS SPA
│   └── wwwroot/
│       ├── css/
│       ├── js/
│       │   ├── strides/
│       │   ├── navigation/
│       │   └── utils/
│       └── templates/
├── PromiseModelOnline.Auth.Tests/  # Auth server tests (NUnit)
├── PromiseModelOnline.Api.Tests/   # API tests (NUnit)
├── PromiseModelOnline.Client.Tests/ # UI tests (Selenium)
├── db/init/                        # Database initialization scripts
│   └── run-init.sh                 # Creates databases, logins, users
├── secrets/                        # Local secret files (gitignored)
├── .github/workflows/              # CI/CD pipelines
├── docker-compose.yml              # Service orchestration
└── .env                            # Non-sensitive environment defaults
```
