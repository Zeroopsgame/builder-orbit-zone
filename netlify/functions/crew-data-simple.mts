import { getStore } from "@netlify/blobs";

export default async (req: Request) => {
  console.log("🔍 Simple function called with method:", req.method);

  // CORS headers for all responses
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };

  // Handle preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const store = getStore("crew-status");

    if (req.method === "GET") {
      console.log("📖 GET request - fetching data");
      const data = await store.get("crew-members");

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

        await store.set("crew-members", JSON.stringify(sampleData));
        return new Response(JSON.stringify(sampleData), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const parsedData = typeof data === "string" ? JSON.parse(data) : data;
      return new Response(JSON.stringify(parsedData), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      console.log("📝 POST request - saving data");
      const body = await req.text();
      console.log("Body received:", body);

      const { crewMembers } = JSON.parse(body);
      console.log("Parsed crewMembers:", crewMembers?.length, "members");

      await store.set("crew-members", JSON.stringify(crewMembers));
      console.log("��� Data saved successfully");

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Function error:", error);
    return new Response(
      JSON.stringify({
        error: "Server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
};
