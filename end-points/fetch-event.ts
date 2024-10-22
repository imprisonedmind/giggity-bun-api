import { ObjectId } from "mongodb"; // Use ObjectId instead of Long
import {
  badJsonResponse,
  closeClient,
  connectClient,
  db,
  jsonResponse,
  red,
} from "../lib/utilities.ts";

export async function fetchEvent(req: Request) {
  const url = new URL(req.url);
  const uid = url.searchParams.get("uid"); // Unique Identifier (basically id)

  console.log(uid);

  if (!uid) {
    return badJsonResponse("UID is required", 400); // Ensure UID is provided
  }

  try {
    await connectClient();
    const collection = db.collection("events");

    // Convert the UID to ObjectId
    const objectId = new ObjectId(uid);

    // Query the document with matching _id
    const event = await collection.findOne({ _id: objectId });

    if (!event) {
      return badJsonResponse("Event not found", 404);
    }

    return jsonResponse({
      success: true,
      event: event, // Return the matching event
    });
  } catch (error) {
    console.error("Failed to fetch event:", error);
    return badJsonResponse("Failed to fetch event", 500);
  }
}
