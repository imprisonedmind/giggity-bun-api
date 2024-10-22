import { fetchQuicketEvents } from "./fetch-quicket-events.ts";
import {
  blue,
  closeClient,
  connectClient,
  db,
  green,
  jsonResponse,
  logProgress,
  reset,
  yellow,
} from "../lib/utilities.ts";

export async function putEvents() {
  // Start the background process
  backgroundEventProcessing().catch(console.error);
  // Immediately return a response
  return jsonResponse(
    {
      success: true,
      message: "Event processing started. Please be patient.",
    },
    202
  );
}

async function backgroundEventProcessing() {
  try {
    let currentPage = 1;
    let totalPages = 1;
    let totalEventsProcessed = 0;
    let updated = 0;
    let inserted = 0;

    do {
      const {
        events,
        totalPages: pages,
        currentPage: page,
      } = await fetchQuicketEvents({ pageSize: 200, page: currentPage });

      const results = await saveEventsToMongo(events);
      updated += results.updated;
      inserted += results.inserted;
      totalEventsProcessed += events.length;

      // Calculate progress
      logProgress(currentPage, totalPages);
      totalPages = pages;
      currentPage++;
    } while (currentPage <= totalPages);

    console.log(
      `${green}Successfully processed ${totalEventsProcessed} events!${reset}\n` +
        `${blue}Inserted: ${inserted} | Updated: ${updated}${reset}`
    );
  } catch (e) {
    console.error(`${yellow}Error in background processing:${reset}`, e);
  }
}

async function saveEventsToMongo(
  events: any[]
): Promise<{ updated: number; inserted: number }> {
  try {
    await connectClient();
    const eventsCollection = db.collection("events");
    let updated = 0;
    let inserted = 0;

    for (const event of events) {
      // Remove schedules before processing
      delete event.schedules;

      // Add last updated timestamp
      event.lastUpdated = new Date();

      try {
        const result = await eventsCollection.updateOne(
          { id: event.id },
          {
            $set: event,
            $setOnInsert: { firstCreated: new Date() },
          },
          { upsert: true }
        );

        if (result.upsertedCount > 0) {
          console.log(`${blue}Inserted event: ${event.name}${reset}`);
          inserted++;
        } else if (result.modifiedCount > 0) {
          console.log(`${green}Updated event: ${event.name}${reset}`);
          updated++;
        } else {
          console.log(`${yellow}Event unchanged: ${event.name}${reset}`);
        }
      } catch (error) {
        console.error(`Error processing event ${event.id}:`, error);
      }
    }

    return { updated, inserted };
  } catch (error) {
    console.error("Error processing events:", error);
    throw new Error("Failed to process events");
  }
}
