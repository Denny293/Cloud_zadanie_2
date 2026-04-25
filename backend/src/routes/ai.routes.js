const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const { generateTripSuggestion } = require("../controllers/ai.controller");

const router = express.Router();

router.use(authMiddleware);

router.post("/generate-trip", generateTripSuggestion);

module.exports = router;
