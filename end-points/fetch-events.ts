import {
  badJsonResponse,
  connectClient,
  db,
  jsonResponse,
} from "../lib/utilities.ts";

export async function fetchEvents(req: Request) {
  const url = new URL(req.url);
  const pageSize = 20;
  const searchParams = url.searchParams;
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const tags = searchParams.get("tags")?.split(",") || [];
  const location = searchParams.get("location");
  const venue = searchParams.get("venue");
  const name = searchParams.get("name");
  // New date range parameters
  const daysAhead = parseInt(searchParams.get("daysAhead") || "7", 10); // Default to 7 days
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(now.getDate() + daysAhead);
  if (isNaN(currentPage) || currentPage < 1) {
    return badJsonResponse("Invalid page number", 400);
  }
  if (isNaN(daysAhead) || daysAhead < 0) {
    return badJsonResponse("Invalid days ahead parameter", 400);
  }
  try {
    await connectClient();
    const collection = db.collection("events");
    // Create a query object to filter results
    const query: any = {
      // Add date range filter
      startDate: {
        $gte: now.toISOString(), // Greater than or equal to current time
        // $lte: futureDate.toISOString(), // Less than or equal to future date
      },
      endDate: {
        $gt: now.toISOString(), // Less than or equal to future date
      },
    };
    if (tags.length > 0) {
      query["$or"] = tags.map((tag) => ({
        tags: { $regex: tag, $options: "i" },
      }));
    }
    if (location) {
      const locationMorph = location.replace(/%20/g, " ");
      query["locality.levelThree"] = {
        $regex: `^${locationMorph}$`,
        $options: "i",
      };
    }
    if (venue) {
      query["venue.name"] = { $regex: venue, $options: "i" };
    }
    if (name) {
      query["name"] = { $regex: name, $options: "i" };
    }
    // Fetch total number of filtered records
    const totalRecords = await collection.countDocuments(query);
    // Calculate total pages
    const totalPages = Math.ceil(totalRecords / pageSize);
    // Ensure current page is within valid bounds
    if (currentPage > totalPages && totalPages !== 0) {
      return badJsonResponse("Current page exceeds total pages", 400);
    }
    // Calculate the number of documents to skip
    const skip = (currentPage - 1) * pageSize;
    const currentRecords = Math.min(pageSize, totalRecords - skip);
    // Fetch filtered events for the current page
    const events = await collection
      .find(query)
      .sort({ startDate: 1, endDate: 1 })
      .skip(skip)
      .limit(pageSize)
      .toArray();
    return jsonResponse({
      success: true,
      currentPage: currentPage,
      totalPages: totalPages,
      currentRecords: currentRecords,
      records: totalRecords,
      events: events,
      dateRange: {
        from: now.toISOString(),
        to: futureDate.toISOString(),
        daysAhead: daysAhead,
      },
    });
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return badJsonResponse("Failed to fetch events", 500);
  }
}
