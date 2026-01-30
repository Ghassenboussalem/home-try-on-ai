import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TRIPO_API_URL = "https://api.tripo3d.ai/v2/openapi";

interface TripoTaskResponse {
  code: number;
  data: {
    task_id: string;
  };
}

interface TripoTaskStatus {
  code: number;
  data: {
    status: string;
    progress: number;
    output?: {
      pbr_model?: string;
      rendered_image?: string;
    };
    result?: {
      pbr_model?: {
        type: string;
        url: string;
      };
    };
  };
}

async function createTripoTask(apiKey: string, imageUrl: string): Promise<string> {
  console.log("Creating Tripo task for image:", imageUrl);
  
  const response = await fetch(`${TRIPO_API_URL}/task`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      type: "image_to_model",
      file: {
        type: "url",
        url: imageUrl,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Tripo task creation failed:", response.status, errorText);
    throw new Error(`Failed to create Tripo task: ${response.status} - ${errorText}`);
  }

  const data: TripoTaskResponse = await response.json();
  console.log("Tripo task created:", data);
  
  if (data.code !== 0) {
    throw new Error(`Tripo API error: ${data.code}`);
  }

  return data.data.task_id;
}

async function pollTaskStatus(apiKey: string, taskId: string, maxAttempts = 60): Promise<string> {
  console.log("Polling task status for:", taskId);
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(`${TRIPO_API_URL}/task/${taskId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Status check failed:", response.status, errorText);
      throw new Error(`Failed to check task status: ${response.status}`);
    }

    const data: TripoTaskStatus = await response.json();
    console.log(`Task status (attempt ${attempt + 1}):`, data.data.status, data.data.progress);
    console.log("Full response data:", JSON.stringify(data.data));

    if (data.data.status === "success") {
      // Try different paths for the model URL based on API response structure
      const modelUrl = data.data.output?.pbr_model || 
                       data.data.result?.pbr_model?.url;
      
      if (modelUrl) {
        console.log("Task completed! Model URL:", modelUrl);
        return modelUrl;
      } else {
        console.error("Success but no model URL found in response:", JSON.stringify(data.data));
        throw new Error("Task succeeded but no model URL in response");
      }
    }

    if (data.data.status === "failed") {
      console.error("Task failed:", JSON.stringify(data.data));
      throw new Error("Tripo task failed");
    }

    // Wait 2 seconds before next poll
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error("Task timed out after maximum attempts");
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const TRIPO_API_KEY = Deno.env.get("TRIPO_API_KEY");
    if (!TRIPO_API_KEY) {
      console.error("TRIPO_API_KEY not configured");
      throw new Error("TRIPO_API_KEY is not configured");
    }

    const { imageUrl, productName } = await req.json();
    
    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "Image URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating 3D model for: ${productName || "Unknown product"}`);
    console.log(`Image URL: ${imageUrl}`);

    // Create the task
    const taskId = await createTripoTask(TRIPO_API_KEY, imageUrl);
    
    // Poll for completion
    const modelUrl = await pollTaskStatus(TRIPO_API_KEY, taskId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        modelUrl,
        taskId,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error in generate-3d-model:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
