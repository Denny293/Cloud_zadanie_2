import asyncio
import http.client
import json
import os
from fastmcp import FastMCP

mcp = FastMCP("flights")

RAPIDAPI_KEY = os.getenv("R_KEY")

HEADERS_F = {
    "x-rapidapi-key": RAPIDAPI_KEY,
    "x-rapidapi-host": "flights-sky.p.rapidapi.com",
    "Content-Type": "application/json",
}

HEADERS_BOOKING = {
    "x-rapidapi-key": RAPIDAPI_KEY,
    "x-rapidapi-host": "booking-com15.p.rapidapi.com",
    "Content-Type": "application/json",
}


def _sync_request(path: str, headers: dict) -> dict | None:
    host = headers.get("x-rapidapi-host", "flights-sky.p.rapidapi.com")
    try:
        conn = http.client.HTTPSConnection(host)
        conn.request("GET", path, headers=headers)
        res = conn.getresponse()
        raw = res.read().decode("utf-8")
        return json.loads(raw)
    except Exception as e:
        print(f"Request error: {e}")
        return None
    finally:
        conn.close()


async def make_api_request(path: str, headers: dict) -> dict | None:
    return await asyncio.to_thread(_sync_request, path, headers)


@mcp.tool()
async def search_roundtrip(
    departure_id: str,
    arrival_id: str,
    departure_date: str,
    return_date: str,
) -> dict:
    """Search for round-trip flights.

    Args:
        departure_id:   Airport IATA code for departure (e.g. 'VIE', 'JFK')
        arrival_id:     Airport IATA code for arrival (e.g. 'CDG', 'LOS')
        departure_date: Outbound date YYYY-MM-DD (e.g. '2026-04-12')
        return_date:    Return date YYYY-MM-DD (e.g. '2026-04-16')
    """
    path = (
        f"/google/flights/search-roundtrip"
        f"?departureId={departure_id}"
        f"&arrivalId={arrival_id}"
        f"&departureDate={departure_date}"
        f"&arrivalDate={return_date}"
    )
    data = await make_api_request(path, HEADERS_F)
    if not data or not data.get("status"):
        return {"status": "error", "message": data.get("message", "No response") if data else "No response"}
    return {
        "status": "ok",
        "route": f"{departure_id} -> {arrival_id}",
        "departure_date": departure_date,
        "return_date": return_date,
        "top_flights": data.get("data", {}).get("topFlights", [])[:4],
        "other_flights": data.get("data", {}).get("otherFlights", [])[:4],
    }


@mcp.tool()
async def search_oneway(
    departure_id: str,
    arrival_id: str,
    departure_date: str,
) -> dict:
    """Search for one-way flights.

    Args:
        departure_id:   Airport IATA code for departure (e.g. 'VIE', 'JFK')
        arrival_id:     Airport IATA code for arrival (e.g. 'CDG', 'LOS')
        departure_date: Travel date YYYY-MM-DD (e.g. '2026-04-17')
    """
    path = (
        f"/google/flights/search-oneway"
        f"?departureId={departure_id}"
        f"&arrivalId={arrival_id}"
        f"&departureDate={departure_date}"
    )
    data = await make_api_request(path, HEADERS_F)
    if not data or not data.get("status"):
        return {"status": "error", "message": data.get("message", "No response") if data else "No response"}
    return {
        "status": "ok",
        "route": f"{departure_id} -> {arrival_id}",
        "departure_date": departure_date,
        "top_flights": data.get("data", {}).get("topFlights", [])[:4],
        "other_flights": data.get("data", {}).get("otherFlights", [])[:4],
    }


@mcp.tool()
async def search_hotels(
    latitude: float,
    longitude: float,
    arrival_date: str,
    departure_date: str,
    adults: int = 1,
    room_qty: int = 1,
    currency_code: str = "EUR",
) -> dict:
    """Search for hotels near a set of coordinates.

    Args:
        latitude:       Latitude of the target location (e.g. 19.242)
        longitude:      Longitude of the target location (e.g. 72.858)
        arrival_date:   Check-in date YYYY-MM-DD (e.g. '2026-04-08')
        departure_date: Check-out date YYYY-MM-DD (e.g. '2026-04-22')
        adults:         Number of adults (default 1)
        room_qty:       Number of rooms (default 1)
        currency_code:  Currency for prices (default 'EUR')
    """
    path = (
        f"/api/v1/hotels/searchHotelsByCoordinates"
        f"?latitude={latitude}"
        f"&longitude={longitude}"
        f"&arrival_date={arrival_date}"
        f"&departure_date={departure_date}"
        f"&adults={adults}"
        f"&room_qty={room_qty}"
        f"&units=metric"
        f"&page_number=1"
        f"&temperature_unit=c"
        f"&languagecode=en-us"
        f"&currency_code={currency_code}"
    )
    data = await make_api_request(path, HEADERS_BOOKING)
    if not data or not data.get("status"):
        return {"status": "error", "message": data.get("message", "No response") if data else "No response"}
    results = data.get("data", {}).get("result", [])
    if not results:
        return {"status": "ok", "total": 0, "hotels": []}
    return {
        "status": "ok",
        "total": data.get("data", {}).get("count", 0),
        "hotels": results[:8],
    }


@mcp.tool()
async def get_hotel_details(
    hotel_id: int,
    arrival_date: str,
    departure_date: str,
    adults: int = 1,
    room_qty: int = 1,
    currency_code: str = "EUR",
) -> dict:
    """Get detailed information about a specific hotel.

    Args:
        hotel_id:      Booking.com hotel ID (e.g. 191605) — get this from search_hotels
        arrival_date:  Check-in date YYYY-MM-DD
        departure_date: Check-out date YYYY-MM-DD
        adults:        Number of adults (default 1)
        room_qty:      Number of rooms (default 1)
        currency_code: Currency for prices (default 'EUR')
    """
    path = (
        f"/api/v1/hotels/getHotelDetails"
        f"?hotel_id={hotel_id}"
        f"&arrival_date={arrival_date}"
        f"&departure_date={departure_date}"
        f"&adults={adults}"
        f"&room_qty={room_qty}"
        f"&units=metric"
        f"&temperature_unit=c"
        f"&languagecode=en-us"
        f"&currency_code={currency_code}"
    )
    data = await make_api_request(path, HEADERS_BOOKING)
    if not data or not data.get("status"):
        return {"status": "error", "message": data.get("message", "No response") if data else "No response"}
    return {
        "status": "ok",
        "data": data.get("data", {}),
    }


@mcp.tool()
async def get_hotel_details(
    arrd_hotel_flight: list,
    arrival_date: str,
    departure_date: str,
    adults: int = 1,
    room_qty: int = 1,
    currency_code: str = "EUR",
) -> dict:
    """Get detailed information about a specific hotel.

    Args:
        hotel_id:      Booking.com hotel ID (e.g. 191605) — get this from search_hotels
        arrival_date:  Check-in date YYYY-MM-DD
        departure_date: Check-out date YYYY-MM-DD
        adults:        Number of adults (default 1)
        room_qty:      Number of rooms (default 1)
        currency_code: Currency for prices (default 'EUR')
    """
    path = (
        f"/api/v1/hotels/getHotelDetails"
        f"?hotel_id={hotel_id}"
        f"&arrival_date={arrival_date}"
        f"&departure_date={departure_date}"
        f"&adults={adults}"
        f"&room_qty={room_qty}"
        f"&units=metric"
        f"&temperature_unit=c"
        f"&languagecode=en-us"
        f"&currency_code={currency_code}"
    )
    data = await make_api_request(path, HEADERS_BOOKING)
    if not data or not data.get("status"):
        return {"status": "error", "message": data.get("message", "No response") if data else "No response"}
    return {
        "status": "ok",
        "data": data.get("data", {}),
    }

# @mcp.tool()
# async def search_travel_packages(
#     departure_id: str,
#     arrival_id: str,
#     destination_city: str,
#     departure_date: str,
#     return_date: str,
#     destination_latitude: float,
#     destination_longitude: float,
#     adults: int = 2,
#     room_qty: int = 1,
#     currency_code: str = "EUR",
# ) -> dict:
#     """Search for combined flight + hotel travel packages and return 5 best options.

#     Args:
#         departure_id:           Airport IATA code for departure (e.g. 'VIE')
#         arrival_id:             Airport IATA code for arrival (e.g. 'FCO')
#         destination_city:       Name of destination city (e.g. 'Rome')
#         departure_date:         Outbound date YYYY-MM-DD
#         return_date:            Return date YYYY-MM-DD
#         destination_latitude:   Latitude of destination city
#         destination_longitude:  Longitude of destination city
#         adults:                 Number of adults (default 2)
#         room_qty:               Number of rooms (default 1)
#         currency_code:          Currency for prices (default 'EUR')
#     """
#     # Fetch flights and hotels in parallel
#     flights_data, hotels_data = await asyncio.gather(
#         make_api_request(
#             f"/google/flights/search-roundtrip"
#             f"?departureId={departure_id}"
#             f"&arrivalId={arrival_id}"
#             f"&departureDate={departure_date}"
#             f"&arrivalDate={return_date}",
#             HEADERS_F
#         ),
#         make_api_request(
#             f"/api/v1/hotels/searchHotelsByCoordinates"
#             f"?latitude={destination_latitude}"
#             f"&longitude={destination_longitude}"
#             f"&arrival_date={departure_date}"
#             f"&departure_date={return_date}"
#             f"&adults={adults}"
#             f"&room_qty={room_qty}"
#             f"&units=metric"
#             f"&page_number=1"
#             f"&temperature_unit=c"
#             f"&languagecode=en-us"
#             f"&currency_code={currency_code}",
#             HEADERS_BOOKING
#         )
#     )

#     # Extract flights
#     all_flights = []
#     if flights_data and flights_data.get("status"):
#         d = flights_data.get("data", {})
#         all_flights = d.get("topFlights", []) + d.get("otherFlights", [])

#     # Extract hotels
#     all_hotels = []
#     if hotels_data and hotels_data.get("status"):
#         all_hotels = hotels_data.get("data", {}).get("result", [])

#     if not all_flights:
#         return {"status": "error", "message": "No flights found"}
#     if not all_hotels:
#         return {"status": "error", "message": "No hotels found"}

#     # Build 5 options, pairing flights and hotels
#     options = []
#     for i in range(min(5, len(all_flights), len(all_hotels))):
#         flight = all_flights[i]
#         hotel = all_hotels[i]

#         # Extract flight times from nested structure
#         legs = flight.get("legs", [])
#         outbound = legs[0] if legs else {}
#         departure_time = outbound.get("departureDateTime", departure_date + "T00:00:00")
#         arrival_time = outbound.get("arrivalDateTime", departure_date + "T00:00:00")

#         # Build Google Flights link
#         origin_city = departure_id  # fallback to IATA if city not available
#         dest_city = destination_city.replace(" ", "+")
#         flights_link = (
#             f"https://www.google.com/travel/flights?q=Flights+from+"
#             f"{origin_city}+to+{dest_city}"
#             f"+on+{departure_date}+returning+{return_date}"
#         )

#         # Build hotel booking link
#         hotel_url = hotel.get("url", "")
#         if not hotel_url:
#             hotel_name = hotel.get("hotel_name", destination_city).replace(" ", "+")
#             hotel_url = (
#                 f"https://www.booking.com/searchresults.html"
#                 f"?ss={hotel_name}"
#                 f"&checkin={departure_date}"
#                 f"&checkout={return_date}"
#                 f"&group_adults={adults}"
#             )

#         options.append({
#             "option_id": i + 1,
#             "flight": {
#                 "airline": flight.get("carriers", ["Unknown"])[0] if flight.get("carriers") else "Unknown",
#                 "departure_time": departure_time,
#                 "arrival_time": arrival_time,
#                 "price": flight.get("price", "N/A"),
#                 "duration": outbound.get("durationInMinutes", "N/A"),
#                 "booking_link": flights_link,
#             },
#             "hotel": {
#                 "name": hotel.get("hotel_name", "Unknown"),
#                 "description": hotel.get("hotel_name_trans", hotel.get("hotel_name", "")),
#                 "rating": hotel.get("review_score", "N/A"),
#                 "price_per_night": hotel.get("min_total_price", "N/A"),
#                 "check_in_date": departure_date,
#                 "check_out_date": return_date,
#                 "booking_link": hotel_url,
#             }
#         })

#     return {"travel_options": options}


if __name__ == "__main__":
    mcp.run(transport="http", host="0.0.0.0", port=8080)