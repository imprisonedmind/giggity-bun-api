import { serve } from "bun";
import { putEvents } from "./end-points/put-events-mongo.ts";
import { fetchEvent } from "./end-points/fetch-event.ts";
import { methodGuard } from "./lib/utilities.ts";
import { putDropEvents } from "./end-points/put-drop-events.ts";
import {
  processSingleDocument,
  putOpenAIEdits,
} from "./end-points/post-openapi.ts"; // Start Bun server
import { fetchEvents } from "./end-points/fetch-events.ts";

// Start Bun server
serve({
  idleTimeout: 255,
  port: 8080,
  fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname;

    switch (pathname) {
      case "/event":
        return methodGuard("GET", fetchEvent, pathname)(req);
      case "/events":
        return methodGuard("GET", fetchEvents, pathname)(req);
      case "/events/mongo":
        return methodGuard("POST", putEvents, pathname)(req);
      case "/events/mongo/drop":
        return methodGuard("POST", putDropEvents, pathname)(req);
      case "/events/mongo/openai":
        return methodGuard("POST", putOpenAIEdits, pathname)(req);
      default:
        return new Response("Welcome to the Bun MongoDB API!", {
          headers: { "Content-Type": "text/plain" },
        });
    }
  },
});

console.log("Bun server running on http://localhost:8080");
