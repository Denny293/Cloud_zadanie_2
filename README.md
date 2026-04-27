TravelFlow — Project Documentation

1. Project Overview
TravelFlow is a travel recommendation engine. The user provides a destination, dates and an AI Agent finds and ranks the best 5 flight and hotel combinations. Results can be saved as favorites and accessed later.
Application logic runs on Microsoft Azure. The AI Agent and MCP tooling run on Google Cloud Platform (GCP).

Task Analysis
Finding a proper accommodation and flight tickets is a tedious task, users must manually search multiple platforms for flights and hotels, compare combinations, and assess value themselves. TravelFlow addresses this by automating the discovery and ranking of flight + hotel combinations through an AI agent, reducing what would typically take 30–60 minutes of manual searching to a single query.
The agent must reason over combinations rather than just returning raw results, which requires an LLM-based layer rather than simple API aggregation.
Key constraints identified during design:
External API rate limits — RapidAPI-based flight and hotel endpoints have request quotas, so the agent must be efficient with tool calls.
External API accuracy — RapidAPI-based flight and hotel endpoints are not 100 % accurate.
Stateful results — Users expect to revisit saved trips, requiring persistent storage.
No exposed backend — The backend must not be publicly accessible; all client traffic must be proxied through the frontend container.


2. Technology Stack

Frontend - React + Vite (served via nginx) - Azure Container Apps
Backend - Node.js + Express - Azure Container Apps (internal ingress)
Database - PostgreSQL 16 + Prisma v7 - Azure Database for PostgreSQL Flexible Server
AI Agent - Vertex AI Agent Engine (ADK / Reasoning Engine) - GCP us-west1
MCP Server - Python + FastMCP - Google Cloud Run europe-west1
Cross-cloud Auth - Workload Identity Federation - Azure Managed Identity ↔ GCP
Media - Pexels API - External
Flight data - Google Flights Sky API via RapidAPI - External
Hotel data - Booking.com API via RapidAPI - External


3. System Architecture
Logic Flow
User Input — The React frontend captures destination, dates, budget, and preferences.
Nginx Proxy — The frontend nginx container proxies /auth, /trips, and /ai routes to the internal backend container app. This avoids CORS issues and keeps the backend off the public internet.
Backend — The Express backend handles JWT authentication, persists data to Azure PostgreSQL via Prisma, and forwards AI requests to Vertex AI Agent Engine.
Cross-Cloud Auth — The backend requests an OIDC token from Azure Managed Identity, sends it to the GCP Workload Identity Pool (azure-pool), which exchanges it for a short-lived GCP access token. No service account keys are used.
AI Agent — The backend calls the Vertex AI Agent Engine (stream_query) using the federated token. The agent uses Gemini 2.5 Pro.
MCP Tools — The agent calls the MCP server on Cloud Run to fetch real-time flight and hotel data via RapidAPI, and uses Google Search for current dates and supplementary information.
Response — The agent returns structured JSON with 5 flight + hotel combinations including booking links. The backend stores the result and returns it to the frontend.
4. Container Networking

5. User Guide
Prerequisites
To run TravelFlow locally you need Docker Desktop installed and running. No other tools are required.
Setup and Launch
Clone the repository and navigate to the project root.
Copy .env.example to .env and fill in the required values 
Start all services with:
docker compose up
Open your browser at http://localhost:8080.
For the AI features to work in local development, you must be authenticated with GCP via Application Default Credentials:
gcloud auth application-default login

Step 1 — Creating an Account
When you open TravelFlow for the first time you will land on the Welcome / Login screen.
Click the Sign Up button.
Enter your email address and choose a password (minimum 8 characters).
Click Create Account.
You will be automatically logged in and redirected to the main search screen.
If an account with that email already exists, you will see an error — use Log In instead.

Step 2 — Logging In
If you already have an account:
On the Welcome screen, enter your email and password.
Click Log In.
You will be redirected to the main search screen.
Your session is stored as a JWT token. You will remain logged in until you click Log Out in the top navigation bar or the token expires.

Step 3 — Searching for a Trip
Once all required fields are filled:
Click the Find Trips button.
A loading indicator will appear — the AI agent is querying live flight and hotel data in real time. This typically takes 15–30 seconds.
Do not refresh the page while results are loading.

Step 4 — Viewing Results
Once the search completes, 5 ranked trip combinations will appear on screen. Each result card shows:
Flight details
Airline name and flight number
Departure and arrival times
Total flight duration and number of stops
Price per person
Hotel details
Hotel name and star rating
Neighbourhood 
Nightly rate and total cost for your stay
Summary
A Book Flight and Book Hotel button — these open the relevant booking page directly in a new tab
Results are ranked by the AI agent based on a balance of price, travel convenience, and accommodation quality — not purely the cheapest option.

Step 5 — Saving a Trip
If you find a combination you like:
Click the Save button on the result card.
You can save multiple combinations from the same search.
Saved trips are linked to your account and stored permanently in the database.

Step 6 — Accessing Saved Trips
Click My Trips in the top navigation bar.
All previously saved combinations are listed here, grouped by search.
The Book Flight and Book Hotel links remain active so you can return and complete a booking at any time.
To remove a saved trip, click the Delete (🗑) icon on the card.

Step 7 — Logging Out
Click your profile icon or username in the top right corner, then click Log Out. Your session token is cleared and you are returned to the Welcome screen.


Team Contributions

[Potapov]
AI Agent configuration (Vertex AI Agent Engine, Gemini prompt design), MCP server implementation (FastMCP tools, RapidAPI integration), cross-cloud Workload Identity Federation setup, Docker image build and Azure Container Apps deployment, PostgreSQL setup on Azure
[Member 2]
e.g. Backend development (Express API, JWT authentication, Prisma schema and migrations), PostgreSQL setup on Azure
[Member 3]
e.g. Frontend development (React components, trip results UI, Pexels integration)


