const prisma = require("../prisma");

const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

const parseTripData = (body) => {
  const {
    start,
    destination,
    startDate,
    finishDate,
    price,
    description,
    flightLink,
    stayLink,
    weather,
    hotel,
    highlights,
  } = body;

  return {
    start,
    destination,
    startDate,
    finishDate,
    price,
    description,
    flightLink,
    stayLink,
    weather,
    hotel,
    highlights: highlights ? JSON.stringify(highlights) : null,
  };
};

const validateTripData = (tripData) => {
  const { start, destination, startDate, finishDate, price, flightLink, stayLink } = tripData;

  if (!start || !destination || !startDate || !finishDate || price === undefined) {
    return "start, destination, startDate, finishDate and price are required";
  }

  const parsedStartDate = new Date(startDate);
  const parsedFinishDate = new Date(finishDate);
  const parsedPrice = Number(price);

  if (Number.isNaN(parsedStartDate.getTime()) || Number.isNaN(parsedFinishDate.getTime())) {
    return "startDate and finishDate must be valid dates";
  }

if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
  return "price must be a non-negative number";
}

  if (parsedFinishDate < parsedStartDate) {
    return "finishDate must be greater than or equal to startDate";
  }

  if (flightLink && !urlRegex.test(flightLink)) {
    return "flightLink must be a valid URL";
  }

  if (stayLink && !urlRegex.test(stayLink)) {
    return "stayLink must be a valid URL";
  }

  return null;
};

const mapTripDataForDb = (tripData) => ({
  start: tripData.start,
  destination: tripData.destination,
  startDate: new Date(tripData.startDate),
  finishDate: new Date(tripData.finishDate),
  price: Math.round(Number(tripData.price)),
  description: tripData.description || null,
  flightLink: tripData.flightLink || null,
  stayLink: tripData.stayLink || null,
  weather: tripData.weather || null,
hotel: tripData.hotel || null,
highlights: tripData.highlights || null,
});

const getTrips = async (req, res) => {
  try {
    const trips = await prisma.trip.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(trips);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

const getTripById = async (req, res) => {
  try {
    const tripId = Number(req.params.id);

    if (Number.isNaN(tripId)) {
      return res.status(400).json({ message: "Invalid trip id" });
    }

    const trip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        userId: req.user.userId,
      },
    });

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    return res.status(200).json(trip);
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

const createTrip = async (req, res) => {
  try {
    const tripData = parseTripData(req.body);
    const validationError = validateTripData(tripData);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const trip = await prisma.trip.create({
      data: {
        userId: req.user.userId,
        ...mapTripDataForDb(tripData),
      },
    });

    return res.status(201).json({
      message: "Trip created successfully",
      trip,
    });
  } catch (error) {
      console.error("Create trip error:", error);
  return res.status(500).json({ message: error.message });
  }
};

const updateTrip = async (req, res) => {
  try {
    const tripId = Number(req.params.id);

    if (Number.isNaN(tripId)) {
      return res.status(400).json({ message: "Invalid trip id" });
    }

    const existingTrip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        userId: req.user.userId,
      },
    });

    if (!existingTrip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    const tripData = parseTripData(req.body);
    const validationError = validateTripData(tripData);

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: mapTripDataForDb(tripData),
    });

    return res.status(200).json({
      message: "Trip updated successfully",
      trip: updatedTrip,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

const deleteTrip = async (req, res) => {
  try {
    const tripId = Number(req.params.id);

    if (Number.isNaN(tripId)) {
      return res.status(400).json({ message: "Invalid trip id" });
    }

    const existingTrip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        userId: req.user.userId,
      },
    });

    if (!existingTrip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    await prisma.trip.delete({
      where: { id: tripId },
    });

    return res.status(200).json({ message: "Trip deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

const toggleFavorite = async (req, res) => {
  try {
    const tripId = Number(req.params.id);

    if (Number.isNaN(tripId)) {
      return res.status(400).json({ message: "Invalid trip id" });
    }

    const existingTrip = await prisma.trip.findFirst({
      where: {
        id: tripId,
        userId: req.user.userId,
      },
    });

    if (!existingTrip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: {
        favorites: !existingTrip.favorites,
      },
    });

    return res.status(200).json({
      message: "Favorite status updated successfully",
      trip: updatedTrip,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getTrips,
  getTripById,
  createTrip,
  updateTrip,
  deleteTrip,
  toggleFavorite,
};
