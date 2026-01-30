import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const KIE_API_URL = "https://api.kie.ai/api/v1/jobs";

interface SelectedProduct {
  id: string;
  name: string;
  image: string;
  placement: string;
}

interface VisualizerRequest {
  roomImageUrl: string;
  products: SelectedProduct[];
  aspectRatio?: string;
}

async function createTask(
  apiKey: string,
  inputUrls: string[],
  prompt: string,
  aspectRatio: string
): Promise<string> {
  console.log("Creating Kie AI task with prompt:", prompt);
  console.log("Input URLs:", inputUrls);

  const response = await fetch(`${KIE_API_URL}/createTask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "flux-2/pro-image-to-image",
      input: {
        input_urls: inputUrls,
        prompt: prompt,
        aspect_ratio: aspectRatio,
        resolution: "2K",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Kie AI createTask failed:", response.status, errorText);
    throw new Error(`Failed to create Kie AI task: ${response.status}`);
  }

  const data = await response.json();
  console.log("Kie AI createTask response:", data);

  if (data.code !== 200) {
    throw new Error(`Kie AI error: ${data.message || "Unknown error"}`);
  }

  return data.data.taskId;
}

async function pollTaskStatus(
  apiKey: string,
  taskId: string,
  maxAttempts = 30
): Promise<string> {
  console.log("Polling Kie AI task status for:", taskId);

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(
      `${KIE_API_URL}/recordInfo?taskId=${taskId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Status check failed:", response.status, errorText);
      throw new Error(`Failed to check task status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Task status (attempt ${attempt + 1}):`, data.data?.state);

    if (data.data?.state === "success") {
      const resultJson = JSON.parse(data.data.resultJson || "{}");
      const resultUrl = resultJson.resultUrls?.[0];

      if (resultUrl) {
        console.log("Task completed! Result URL:", resultUrl);
        return resultUrl;
      } else {
        throw new Error("Task succeeded but no result URL in response");
      }
    }

    if (data.data?.state === "fail") {
      const failMsg = data.data.failMsg || "Unknown error";
      console.error("Task failed:", failMsg);
      throw new Error(`Kie AI task failed: ${failMsg}`);
    }

    // Wait 10 seconds before next poll
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }

  throw new Error("Task timed out after maximum attempts");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const KIE_AI_API_KEY = Deno.env.get("KIE_AI_API_KEY");
    if (!KIE_AI_API_KEY) {
      throw new Error("KIE_AI_API_KEY is not configured");
    }

    const { roomImageUrl, products, aspectRatio = "auto" }: VisualizerRequest =
      await req.json();

    if (!roomImageUrl) {
      return new Response(
        JSON.stringify({ error: "Room image URL is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one product is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Starting room visualization");
    console.log("Room image:", roomImageUrl);
    console.log("Products:", products);

    // Build input URLs: room image first, then product images
    const inputUrls = [roomImageUrl, ...products.map((p) => p.image)];

    // Build detailed prompt for furniture placement
    const productDescriptions = products
      .map(
        (p, index) =>
          `furniture item ${index + 1} (${p.name}) placed ${p.placement}`
      )
      .join(", ");

    const prompt = `Transform this room photo by realistically adding the furniture shown in the reference images. Place ${productDescriptions}. Maintain realistic lighting, shadows, and perspective matching the room. The furniture should look naturally integrated into the space, matching the room's lighting conditions and floor perspective. Keep the room's original architecture, windows, and other elements intact. Professional interior design photography style, photorealistic result.`;

    // Step 1: Create the task
    const taskId = await createTask(
      KIE_AI_API_KEY,
      inputUrls,
      prompt,
      aspectRatio
    );

    // Step 2: Poll for completion
    const resultUrl = await pollTaskStatus(KIE_AI_API_KEY, taskId);

    return new Response(
      JSON.stringify({
        success: true,
        resultUrl,
        taskId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in room-visualizer:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
