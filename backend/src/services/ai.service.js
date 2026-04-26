const { GoogleAuth } = require("google-auth-library");

const LOCATION = process.env.GCP_LOCATION || "us-west1";
const RESOURCE_ID = process.env.GCP_RESOURCE_ID || "2423481957292703744";
const BASE_URL = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/1035833352819/locations/${LOCATION}/reasoningEngines/${RESOURCE_ID}`;

// Mirrors the Python get_gcp_token() function exactly
async function getGCPToken() {
  if (process.env.RUNNING_ON_AZURE) {
    // Azure Managed Identity → exchange for GCP token via STS
    const identityEndpoint = process.env.IDENTITY_ENDPOINT;
    const identityHeader = process.env.IDENTITY_HEADER;

    // Step 1: Get Azure token
    const azureResp = await fetch(
      `${identityEndpoint}?api-version=2019-08-01&resource=https://management.azure.com/`,
      { headers: { "X-IDENTITY-HEADER": identityHeader } }
    );
    const azureData = await azureResp.json();
    const azureToken = azureData.access_token;
    console.log("Got Azure token OK");

    // Step 2: Exchange Azure token for GCP token via STS
    const stsResp = await fetch("https://sts.googleapis.com/v1/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
        audience: "//iam.googleapis.com/projects/1035833352819/locations/global/workloadIdentityPools/azure-pool/providers/azure-provider",
        scope: "https://www.googleapis.com/auth/cloud-platform",
        requested_token_type: "urn:ietf:params:oauth:token-type:access_token",
        subject_token: azureToken,
        subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
      }),
    });
    console.log("STS response status:", stsResp.status);
    const stsData = await stsResp.json();
    return stsData.access_token;

  } else {
    // Local: use gcloud application-default credentials
    const auth = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    return tokenResponse.token;
  }
}

function buildTripPrompt({ preferences }) {
  const from = preferences?.startCity || "any city";
  const to = preferences?.destination || "anywhere";
  const startDate = preferences?.startDate || "flexible";
  const endDate = preferences?.endDate || "flexible";
  const budget = preferences?.budget ? `${preferences.budget} EUR` : "flexible";
  const wishes = preferences?.wishes || "no specific preferences";

return `You are a travel recommendation assistant.

Generate exactly 5 travel package recommendations for the following trip:
- From: ${from}
- To: ${to}
- Departure date: ${startDate}
- Return date: ${endDate}
- Max budget per person: ${budget}
- Preferences: ${wishes}

IMPORTANT RULES:
- Do NOT search for real flights or hotels
- Generate realistic travel packages with estimated prices
- Always include return trip back to ${from}
- Each package should be a different option

You MUST respond with ONLY a valid JSON array. No text before or after. No markdown.

[
  {
    "title": "Trip title",
    "destination": "City, Country",
    "start": "${from}",
    "startDate": "YYYY-MM-DD",
    "finishDate": "YYYY-MM-DD",
    "price": 1200,
    "description": "Short description in 1-2 sentences.",
    "tags": ["tag1", "tag2"],
    "hotel": "Name of recommended hotel",
    "weather": "Expected weather, e.g. sunny 24°C",
    "highlights": ["Activity 1", "Activity 2", "Activity 3"],
    "image_query": "unique search query combining destination and trip theme/category",
    "flightLink": "https://www.google.com/flights",
    "stayLink": "https://www.booking.com"
  }
]

Respond with ONLY the JSON array. Nothing else.`;
}

// Mirrors the Python query_agent() function
async function queryAgent(message) {
  const token = await getGCPToken();

  const resp = await fetch(`${BASE_URL}:streamQuery?alt=sse`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      class_method: "stream_query",
      input: {
        message,
        user_id: "travel-app-user",
      },
    }),
  });

  if (!resp.ok) {
    const errorText = await resp.text();
    let errorData;
    try { errorData = JSON.parse(errorText); } catch { errorData = { raw: errorText }; }
    const err = new Error("GCP Vertex AI request failed");
    err.statusCode = resp.status;
    err.details = errorData;
    throw err;
  }

  // Parse SSE stream — same logic as Python iter_lines()
  const text = await resp.text();
  const lines = text.split("\n");
  const result = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const event = JSON.parse(line);
      const parts = event?.content?.parts || [];
      for (const part of parts) {
        if (part.text && event.author) {
          result.push(part.text);
        }
      }
    } catch {
      // skip non-JSON lines
    }
  }

  return result.join("\n");
}

function parseTrips(rawText) {
  if (!rawText) return [];
  const jsonMatch = rawText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  try {
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed)) return [];

    return parsed.slice(0, 5).map((item) => ({
      title: item.title || item.category || `Option ${item.option_id}`,
      destination: item.destination || "Unknown",
      start: item.start || item.flight?.origin || "Unknown",
      startDate: item.startDate || item.flight?.departure_time?.split("T")[0] || "",
      finishDate: item.finishDate || item.flight?.arrival_time?.split("T")[0] || "",
      price: item.price || parseInt(item.total_estimated_cost) || 0,
      description: item.description || item.flight?.summary || "",
      tags: item.tags || [item.category || "travel"],
      hotel: typeof item.hotel === "string" ? item.hotel : item.hotel?.name || "",
      weather: item.weather || "",
      highlights: item.highlights || item.activities || [],
      flightLink: item.flightLink || "https://www.google.com/flights",
      stayLink: item.stayLink || "https://www.booking.com",
    }));
  } catch {
    return [];
  }
}

const generateTrip = async ({ preferences }) => {
  const message = buildTripPrompt({ preferences });
  const rawText = await queryAgent(message);
  const trips = parseTrips(rawText).map(trip => ({
    ...trip,
    start: trip.start && trip.start !== "Unknown" 
      ? trip.start 
      : (preferences?.startCity || "Unknown"),
    destination: trip.destination && trip.destination !== "Unknown" 
      ? trip.destination 
      : (preferences?.destination || "Unknown"),
  }));
  return { trips, raw: rawText };
};
module.exports = { generateTrip };