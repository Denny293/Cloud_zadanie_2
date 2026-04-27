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
  const wishes = preferences?.wishes || "";

  let prompt = `I want to go from ${from} to ${to}`;
  
  if (startDate !== "flexible") prompt += ` on ${startDate}`;
  if (endDate !== "flexible") prompt += ` returning on ${endDate}`;
  if (budget !== "flexible") prompt += `, budget up to ${budget}`;
  if (wishes) prompt += `, preferences: ${wishes}`;

  return prompt;
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

function parseTrips(rawText, preferences) {
  if (!rawText) return [];

  const cleaned = rawText.replace(/```json|```/g, "").trim();
  const travelOptionsMatch = cleaned.match(/\{[\s\S]*"travel_options"[\s\S]*\}/);
  if (!travelOptionsMatch) return [];

  let options;
  try {
    const parsed = JSON.parse(travelOptionsMatch[0]);
    options = parsed.travel_options;
    if (!Array.isArray(options) || options.length === 0) return [];
  } catch {
    return [];
  }

  const fallbackFlightLink = `https://www.google.com/travel/flights?q=Flights+to+${preferences?.destination}+from+${preferences?.startCity}+on+${preferences?.startDate}+returning+${preferences?.endDate}`;

  return options.slice(0, 5).map((item) => {
    const flight = item.flight || {};
    const hotel = item.hotel || {};

    return {
      // Original fields — names unchanged
      title: `${item.category} — ${hotel.name || ""}`,
      destination: preferences?.destination || "Unknown",
      start: preferences?.startCity || "Unknown",
      startDate: hotel.check_in_date || "",
      finishDate: hotel.check_out_date || "",
      price: Math.round(parseFloat(item.total_estimated_cost) || 0),
      description: hotel.description || "",
      tags: [item.category],
      hotel: hotel.name || "",
      highlights: [hotel.description || ""],
      flightLink: flight.booking_link || fallbackFlightLink,
      stayLink: hotel.booking_link || "https://www.booking.com",

      // New fields for previously unparsed variables
      optionId: item.option_id ?? null,
      category: item.category || "Unknown",
      flightSummary: flight.summary || "",
      flightDeparture: flight.departure_time || "",
      flightArrival: flight.arrival_time || "",
      hotelActivities: hotel.activities || "",
    };
  });
}

const generateTrip = async ({ preferences }) => {
  const message = buildTripPrompt({ preferences });
  const rawText = await queryAgent(message);
  console.log("RAW TEXT FROM GCP:", rawText.substring(0, 500));
  const trips = parseTrips(rawText, preferences);
  return { trips, raw: rawText };
};

module.exports = { generateTrip };