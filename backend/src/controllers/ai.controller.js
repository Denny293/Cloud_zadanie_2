const { generateTrip } = require("../services/ai.service");

const generateTripSuggestion = async (req, res) => {
  try {
    const { prompt, preferences } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ message: "prompt is required" });
    }

    const result = await generateTrip({
      prompt: prompt.trim(),
      preferences,
    });

    return res.status(200).json({
      message: "AI trip generated successfully",
      result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        message: "AI provider error",
        details: error.details,
      });
    }

    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  generateTripSuggestion,
};
