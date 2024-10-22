import { MongoClient } from "mongodb";

export const client = new MongoClient(`${process.env.MONGO_URL}`);
let isConnected = false; // Track connection state

export async function connectClient() {
  if (!isConnected) {
    await client.connect();
    isConnected = true; // Set to true once connected
    console.log("Connected to MongoDB");
  }
}

export async function closeClient() {
  if (isConnected) {
    await client.close();
    isConnected = false; // Set to false once closed
    console.log("Disconnected from MongoDB");
  }
}

export const db = client.db(process.env.DATABASE_NAME);

// DROP ALL EVENTS
export async function truncateEventsCollection() {
  const uri = process.env.MONGO_URL; // Make sure this environment variable is set
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  try {
    await connectClient();
    console.log("Connected to MongoDB");

    const eventsCollection = db.collection("events");

    const deleteResult = await eventsCollection.deleteMany({});

    console.log(
      `Deleted ${deleteResult.deletedCount} documents from the events collection`
    );

    // Optional: You can also drop all indexes except the _id index
    // await eventsCollection.dropIndexes();
    // console.log('Dropped all indexes from the events collection');
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

// REQUEST METHOD HELPER
export function methodGuard(
  validMethod: string,
  handler: (req: any) => Promise<Response>,
  pathname: string
) {
  return function (req: { method: string }) {
    if (req.method !== validMethod) {
      console.error(`Method Not Allowed. Expected ${validMethod}`);
      return new Response(`Method Not Allowed. Expected ${validMethod}`, {
        status: 400,
      });
    }

    logPathname(pathname, req.method, validMethod);

    return handler(req);
  };
}

// JSON RESPONSE - GOOD
export function jsonResponse(value: any, statusCode: number = 200) {
  return new Response(JSON.stringify(value), {
    status: statusCode,
    headers: { "Content-Type": "application/json" },
  });
}

// JSON RESPONSE - BAD
export function badJsonResponse(errorMsg: string, statusCode: number = 400) {
  return new Response(JSON.stringify({ error: errorMsg }), {
    status: statusCode,
    headers: { "Content-Type": "application/json" },
  });
}

//CONSOLE LOG COLOURS
export const reset = "\x1b[0m"; // Reset to default
export const red = "\x1b[31m"; // Red text
export const green = "\x1b[32m"; // Green text
export const yellow = "\x1b[33m"; // Yellow text
export const blue = "\x1b[34m"; // Blue text

// LOG OUT URL PATH NAME
export function logPathname(
  pathname: string,
  method: string,
  validMethod: string
) {
  const isValidMethod = validMethod === method;
  let isValidIdentifier;
  switch (isValidMethod) {
    case false:
      isValidIdentifier = "✗";
      break;
    default:
      isValidIdentifier = "✅";
      break;
  }

  let primaryColor;
  switch (method) {
    case "PUT":
      primaryColor = yellow;
      break;
    case "POST":
      primaryColor = blue;
      break;
    default:
      primaryColor = green;
      break;
  }

  console.log(
    `${primaryColor} ${validMethod}: ${pathname} ${isValidIdentifier} ${reset}`
  );
}

// REUSABLE LOGGER
export function logProgress(currentPage: number, totalPages: number) {
  const progress = Math.floor((currentPage / totalPages) * 100);
  const progressBar =
    "[" + ":".repeat(progress / 5) + "-".repeat(20 - progress / 5) + "]";
  console.log(
    `${green} ${progressBar} ${progress}% / Page ${currentPage} / ${totalPages} ${reset}`
  );
}
