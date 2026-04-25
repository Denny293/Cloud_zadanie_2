const buildHeaders = () => {
  const apiKey = process.env.AI_API_KEY;
  const authHeader = process.env.AI_AUTH_HEADER || "Authorization";
  const authScheme = process.env.AI_AUTH_SCHEME || "Bearer";

  if (!apiKey) {
    throw new Error("AI_API_KEY is not set");
  }

  return {
    "Content-Type": "application/json",
    [authHeader]: authScheme ? `${authScheme} ${apiKey}` : apiKey,
  };
};

const generateTrip = async ({ prompt, preferences }) => {
  const apiUrl = process.env.AI_API_URL;
  const model = process.env.AI_MODEL;

  if (!apiUrl) {
    throw new Error("AI_API_URL is not set");
  }

  const payload = {
    prompt,
    preferences: preferences || {},
  };

  if (model) {
    payload.model = model;
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(payload),
  });

  const responseText = await response.text();
  let responseData;

  try {
    responseData = responseText ? JSON.parse(responseText) : {};
  } catch (error) {
    responseData = { raw: responseText };
  }

  if (!response.ok) {
    const serviceError = new Error("AI provider request failed");
    serviceError.statusCode = response.status;
    serviceError.details = responseData;
    throw serviceError;
  }

  return responseData;
};

module.exports = {
  generateTrip,
};
