import { getStore } from "@netlify/blobs";

export async function handler(event, context) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
  };

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  try {
    const store = getStore("crew-status");

    if (event.httpMethod === "GET") {
      // Get crew data
      const data = await store.get("crew-members");

      // If no data exists, return sample data
      if (!data) {
        const sampleData = [
          {
            id: "1",
            name: "OT Sample User",
            isIn: true,
            lastUpdate: new Date().toISOString(),
            location: "",
            notes: "",
          },
        ];

        // Initialize with sample data
        await store.set("crew-members", JSON.stringify(sampleData));

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(sampleData),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: typeof data === "string" ? data : JSON.stringify(data),
      };
    }

    if (event.httpMethod === "POST") {
      // Save crew data
      const { crewMembers } = JSON.parse(event.body);
      await store.set("crew-members", JSON.stringify(crewMembers));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true }),
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  } catch (error) {
    console.error("Netlify Function Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
    };
  }
}
