<div align="center">

# ✈️ TravelFlow

**AI-powered travel planning — flights and hotels, ranked and ready in seconds.**

[![Azure](https://img.shields.io/badge/Azure-Container_Apps-0078D4?style=flat-square&logo=microsoftazure&logoColor=white)](https://azure.microsoft.com)
[![GCP](https://img.shields.io/badge/GCP-Vertex_AI-4285F4?style=flat-square&logo=googlecloud&logoColor=white)](https://cloud.google.com)
[![React](https://img.shields.io/badge/React-Vite-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

</div>

---

## 📖 Overview

TravelFlow is a travel recommendation engine that eliminates the tedious process of manually comparing flights and hotels across multiple platforms. Enter your destination and dates — the AI agent handles the rest, returning the **5 best-ranked flight + hotel combinations** with live pricing and direct booking links.

> **Application logic** runs on **Microsoft Azure** · **AI Agent and MCP tooling** run on **Google Cloud Platform**

---

## 🧩 Technology Stack

| Layer | Technology | Hosting |
|---|---|---|
| **Frontend** | React + Vite, served via nginx | Azure Container Apps (external ingress) |
| **Backend** | Node.js + Express | Azure Container Apps (internal ingress) |
| **Database** | PostgreSQL 16 + Prisma v7 | Azure Database for PostgreSQL Flexible Server |
| **AI Agent** | Vertex AI Agent Engine · Gemini 2.5 Pro | GCP — us-west1 |
| **MCP Server** | Python + FastMCP | Google Cloud Run — europe-west1 |
| **Cross-cloud Auth** | Workload Identity Federation | Azure Managed Identity ↔ GCP |
| **Media** | Pexels API | External |
| **Flight data** | Google Flights Sky API via RapidAPI | External |
| **Hotel data** | Booking.com API via RapidAPI | External |

---

## 🏗️ Architecture

### Logic Flow

```
1. User Input      →  React frontend captures destination, dates, budget, preferences
2. Nginx Proxy     →  Routes /auth /trips /ai to internal backend (no CORS, no public backend)
3. Backend         →  JWT auth · Prisma → PostgreSQL · forwards AI requests to Vertex AI
4. Cross-cloud     →  Azure Managed Identity OIDC token → GCP STS → short-lived GCP token
5. AI Agent        →  Vertex AI Agent Engine (stream_query) · Gemini 2.5 Pro
6. MCP Tools       →  Agent calls Cloud Run MCP server → RapidAPI flights + hotels
7. Response        →  Structured JSON · 5 ranked combinations · booking links → stored + returned
```

### Container Networking

```
User Browser
     │ HTTPS
     ▼
┌─────────────────────────────────────────────────┐
│         Azure Container Apps Environment        │
│                                                 │
│  ┌──────────────┐       ┌───────────────────┐  │
│  │   frontend   │──────▶│     backend       │  │
│  │  (external)  │ HTTP  │    (internal)     │  │
│  │  nginx:80    │       │  Node.js:5000     │  │
│  └──────────────┘       └────────┬──────────┘  │
│                                  │              │
└──────────────────────────────────│──────────────┘
                     ┌─────────────┤
                     │             │ Federated token
          SSL :5432  │             ▼
   ┌─────────────────┴───┐  ┌──────────────────────────┐
   │  Azure Database      │  │  Vertex AI Agent Engine  │
   │  for PostgreSQL      │  │  GCP — us-west1          │
   │  Flexible Server     │  └─────────────┬────────────┘
   │                      │                │
   │  • users table       │  ┌─────────────▼────────────┐
   │  • trips table       │  │  MCP Server (Cloud Run)  │
   └──────────────────────┘  │  europe-west1            │
                              │  FastMCP + RapidAPI      │
                              └──────────────────────────┘
```

---

## 🔐 Cross-Cloud Authentication

No service account keys are used anywhere. Authentication between Azure and GCP uses **Workload Identity Federation**.

<details>
<summary><strong>GCP Setup</strong></summary>

| Setting | Value |
|---|---|
| Workload Identity Pool | `azure-pool` (global) |
| OIDC Provider | `azure-provider` |
| Issuer URI | `https://sts.windows.net/{AZURE_TENANT_ID}/` |
| Allowed audience | `https://management.azure.com/` |
| Attribute mapping | `google.subject = assertion.sub` |
| IAM binding | `roles/aiplatform.user` granted to the pool |

</details>

<details>
<summary><strong>Token Exchange Flow</strong></summary>

```python
# 1. Get Azure token from managed identity
azure_resp = requests.get(
    f"{IDENTITY_ENDPOINT}?api-version=2019-08-01&resource=https://management.azure.com/",
    headers={"X-IDENTITY-HEADER": IDENTITY_HEADER}
)
azure_token = azure_resp.json()["access_token"]

# 2. Exchange for short-lived GCP token via STS
sts_resp = requests.post("https://sts.googleapis.com/v1/token", json={
    "grant_type": "urn:ietf:params:oauth:grant-type:token-exchange",
    "audience": "//iam.googleapis.com/projects/{PROJECT_NUMBER}/locations/global/workloadIdentityPools/azure-pool/providers/azure-provider",
    "scope": "https://www.googleapis.com/auth/cloud-platform",
    "requested_token_type": "urn:ietf:params:oauth:token-type:access_token",
    "subject_token": azure_token,
    "subject_token_type": "urn:ietf:params:oauth:token-type:jwt",
})
gcp_token = sts_resp.json()["access_token"]
```

</details>

---

## 🚀 Deployment

### Docker Images

| Image | Purpose |
|---|---|
| `mumbless/travelflow-frontend:vN` | React + Vite + nginx |
| `mumbless/travelflow-backend:vN` | Node.js + Express + Prisma |

```bash
docker build -t mumbless/travelflow-backend:v1 ./backend
docker build -t mumbless/travelflow-frontend:v1 ./FrontEnd
docker push mumbless/travelflow-backend:v1
docker push mumbless/travelflow-frontend:v1
```

<details>
<summary><strong>Backend Dockerfile notes</strong></summary>

- Use `npm install` (not `--production`) so Prisma CLI is available at build time
- Pass a dummy `DATABASE_URL` at build time — Prisma v7 requires it during `prisma generate`
- `prisma migrate deploy` runs at container startup before the server starts

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate
COPY src ./src
EXPOSE 5000
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
```

</details>

### MCP Server

Deployed to Google Cloud Run:
```
https://llm-{PROJECT_NUMBER}.europe-west1.run.app/mcp
```

Available tools: `search_roundtrip` · `search_oneway` · `search_hotels` · `get_hotel_details` · `search_travel_packages`

---

## ⚙️ Environment Variables

<details>
<summary><strong>Backend (Azure Container App)</strong></summary>

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string to Azure DB |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `PORT` | `5000` |
| `GCP_LOCATION` | `us-west1` |
| `GCP_RESOURCE_ID` | Vertex AI Reasoning Engine ID |
| `RUNNING_ON_AZURE` | `true` — switches auth to WIF mode |
| `IDENTITY_ENDPOINT` | Auto-injected by Azure Container Apps |
| `IDENTITY_HEADER` | Auto-injected by Azure Container Apps |

</details>

<details>
<summary><strong>Frontend (build time — .env.production)</strong></summary>

| Variable | Description |
|---|---|
| `VITE_API_URL` | Frontend's own public URL (API calls proxied via nginx) |
| `VITE_PEXELS_API_KEY` | Pexels API key for destination images |

</details>

---

## 🗄️ Database

| Setting | Value |
|---|---|
| Provider | Azure Database for PostgreSQL Flexible Server |
| Version | PostgreSQL 16 |
| ORM | Prisma v7 with `prisma.config.ts` |
| Tables | `users`, `trips` |

```
postgresql://postgres:PASSWORD@travelflow-db.postgres.database.azure.com:5432/travel_app?schema=public&sslmode=require
```

---

## 💻 Local Development

### Prerequisites

Docker Desktop installed and running. Nothing else required.

### Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/your-org/travelflow.git
cd travelflow

# 2. Configure environment
cp .env.example .env
# Fill in the required values — see Environment Variables above

# 3. Authenticate with GCP (required for AI features)
gcloud auth application-default login

# 4. Start all services
docker compose up
```

| Service | URL |
|---|---|
| Frontend | http://localhost:8080 |
| Backend | http://localhost:5000 |
| Database | localhost:5433 |

> For local GCP auth the backend mounts `~/.config/gcloud` and uses Application Default Credentials instead of Workload Identity Federation.

---

## 📱 User Guide

### 1 — Create an Account

1. Open `http://localhost:8080` — you will land on the **Welcome / Login** screen.
2. Click **Sign Up**.
3. Enter your **email address** and a **password** (minimum 8 characters).
4. Click **Create Account** — you are automatically logged in.

> If an account with that email already exists you will see an error — use **Log In** instead.

### 2 — Log In

1. Enter your **email** and **password** on the Welcome screen.
2. Click **Log In**.

Your session is stored as a JWT token and persists until you log out or the token expires.

### 3 — Search for a Trip

Fill in the search form:

| Field | Required | Example |
|---|---|---|
| Destination | ✅ | `Tokyo, Japan` |
| Departure city | ✅ | `Vienna, Austria` |
| Departure date | ✅ | `2025-08-01` |
| Return date | ✅ | `2025-08-14` |
| Budget (EUR) | ❌ | `1500` |
| Preferences | ❌ | `non-stop flights, 4-star hotels near centre` |

Click **Find Trips**. The AI agent queries live data — expect **15–30 seconds**. Do not refresh while loading.

### 4 — View Results

Five ranked trip combinations appear, each card showing:

**🛫 Flight** — Airline · flight number · departure/arrival times · duration · stops · price per person

**🏨 Hotel** — Name · star rating · neighbourhood · nightly rate · total stay cost

**💳 Summary** — Combined total · **Book Flight** and **Book Hotel** buttons (open in new tab)

Results are ranked by the agent on a balance of price, convenience, and quality — not purely cheapest.

### 5 — Save a Trip

Click **Save** on any result card. You can save multiple combinations from the same search. Saved trips are stored permanently to your account.

### 6 — Access Saved Trips

Click **My Trips** in the navigation bar. All saved combinations are listed here with active booking links. Click the 🗑️ icon to remove a trip.

### 7 — Log Out

Click your **profile icon** in the top right → **Log Out**.

### ⚠️ Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| Search spins > 60s | Vertex AI timeout or RapidAPI quota hit | Refresh and retry · check API quotas |
| "Unauthorized" error | JWT token expired | Log out and log back in |
| No results returned | Destination not recognised or no flights for those dates | Try a nearby major city or different dates |
| Booking link won't open | Pop-up blocker active | Allow pop-ups for the TravelFlow domain |

---

## 👥 Team Contributions

| Member | Contributions |
|---|---|
| **Potapov** | AI Agent configuration (Vertex AI Agent Engine, Gemini prompt design) · MCP server implementation (FastMCP tools, RapidAPI integration) · Workload Identity Federation setup · Docker image build · Azure Container Apps deployment · PostgreSQL setup on Azure |
| **[Member 2]** | Backend development (Express API, JWT authentication, Prisma schema and migrations) · PostgreSQL setup on Azure |
| **[Member 3]** | Frontend development (React components, trip results UI, Pexels integration) |

---

<div align="center">

Built with ☁️ on Azure + GCP

</div>