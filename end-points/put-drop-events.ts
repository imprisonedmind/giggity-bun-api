import {
  badJsonResponse,
  jsonResponse,
  truncateEventsCollection,
} from "../lib/utilities.ts";

export async function putDropEvents() {
  try {
    await truncateEventsCollection();
    return jsonResponse("Successfully dropped events");
  } catch (e) {
    return badJsonResponse("Can not drop.", 500);
  }
}
