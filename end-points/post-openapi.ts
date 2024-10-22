import OpenAI from "openai";
import {
  badJsonResponse,
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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configuration
const BATCH_SIZE = 20; // Number of concurrent processes
const DAYS_AHEAD = 7;
const RATE_LIMIT_DELAY = 1000; // 1 second delay between API calls to avoid rate limits

async function processDocument(doc: any) {
  const currentDate = Date.now();
  const lastEdited = doc.openaiEditedAt;

  // if (currentDate - lastEdited < 24 * 60 * 60 * 1000) {
  //   console.log(
  //     `${yellow} Skipping -- edited within the last 24 hours.${reset}`
  //   );
  //   return;
  // }

  // Add delay to respect rate limits
  await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY));

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
          Consider the incoming JSON object and fill in the INSERT fields.
          openaiEditedAt: Do not change.
          openApiDescription: Make sure the description is said in a marketing manner and long enough for full event explanation.
          genre: Make sure that if this is a music event, the right genres are added.
          tags: Make sure when tagging this event that relevant searchable words are used i.e: ("music","art","nature","climbing") etc.
          seoMetadata: Make sure that SEO content follow gooogle's guiude lines.
          : ${JSON.stringify({
            openaiEditedAt: currentDate,
            openApiDescription: "string",
            genre: "string[]",
            tags: "string[]",
            seoMetadata: {
              title: "string",
              keywords: "string",
              description: "string",
            },
          })}`,
      },
      {
        role: "user",
        content: JSON.stringify(doc),
      },
    ],
    temperature: 1,
    max_tokens: 500,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    response_format: { type: "json_object" },
  });

  const openAiContent = response.choices[0].message.content;

  if (openAiContent) {
    const data = JSON.parse(openAiContent);
    await db.collection("events").updateOne(
      { _id: doc._id },
      {
        $set: {
          openApiDescription: data.openApiDescription,
          genre: data.genre,
          tags: data.tags,
          seoMetadata: data.seoMetadata,
          openaiEditedAt: new Date(),
        },
      }
    );

    console.log(`${yellow} Document ${doc._id} updated with OpenAI${reset}`);
  }
}

// Process a batch of documents concurrently
async function processBatch(docs: any[]) {
  return Promise.all(docs.map((doc) => processDocument(doc)));
}

async function backgroundDocumentProcessing() {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(now.getDate() + DAYS_AHEAD);

  try {
    await connectClient();
    const collection = db.collection("events");

    const query = {
      startDate: {
        $gte: now.toISOString(),
        $lte: futureDate.toISOString(),
      },
    };

    const docs = await collection.find(query).sort({ startDate: 1 }).toArray();
    const totalDocs = docs.length;

    console.log(
      `${green}Processing ${totalDocs} documents between ${now.toISOString()} and ${futureDate.toISOString()}${reset}`
    );

    // Process documents in batches
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = docs.slice(i, i + BATCH_SIZE);
      await processBatch(batch);
      logProgress(Math.min(i + BATCH_SIZE, totalDocs), totalDocs);
    }

    console.log(
      `${green}Successfully processed ${totalDocs} documents within the ${DAYS_AHEAD}-day range!${reset}`
    );
  } catch (e) {
    console.error(`${yellow}Error in background processing:${reset}`, e);
  } finally {
    await closeClient();
  }
}

export async function putOpenAIEdits() {
  backgroundDocumentProcessing().catch(console.error);
  return jsonResponse(
    {
      success: true,
      message:
        "Document processing started in parallel batches. Please be patient.",
    },
    202
  );
}

export async function processSingleDocument(req: any) {
  try {
    await connectClient();
    const collection = db.collection("events");
    const doc = await collection.findOne({ id: 4582 });
    await processDocument(doc);
    return jsonResponse("Success");
  } catch (e) {
    return badJsonResponse(`Could not do it: ${e}`);
  }
}
