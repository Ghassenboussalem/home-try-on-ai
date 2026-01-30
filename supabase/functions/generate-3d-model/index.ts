import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TRIPO_API_URL = "https://api.tripo3d.ai/v2/openapi";

interface TripoUploadResponse {
  code: number;
  data: {
    image_token: string;
  };
}

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

async function fetchImageAsBlob(imageUrl: string): Promise<{ blob: Blob; fileType: string }> {
  console.log("Fetching image from URL:", imageUrl);
  
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }
  
  const contentType = response.headers.get("content-type") || "image/jpeg";
  const blob = await response.blob();
  
  let fileType = "jpg";
  if (contentType.includes("png")) {
    fileType = "png";
  } else if (contentType.includes("webp")) {
    fileType = "webp";
  }
  
  console.log(`Image fetched: ${blob.size} bytes, type: ${fileType}`);
  return { blob, fileType };
}

async function uploadImageToTripo(apiKey: string, imageBlob: Blob): Promise<string> {
  console.log("Uploading image to Tripo...");
  
  const formData = new FormData();
  formData.append("file", imageBlob, "image.jpg");
  
  const response = await fetch(`${TRIPO_API_URL}/upload`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Tripo upload failed:", response.status, errorText);
    throw new Error(`Failed to upload image to Tripo: ${response.status}`);
  }

  const data: TripoUploadResponse = await response.json();
  console.log("Tripo upload response:", data);
  
  if (data.code !== 0) {
    throw new Error(`Tripo upload error: ${data.code}`);
  }

  return data.data.image_token;
}

async function createTripoTask(apiKey: string, imageToken: string, fileType: string): Promise<string> {
  console.log("Creating Tripo task with image_token:", imageToken);
  
  const response = await fetch(`${TRIPO_API_URL}/task`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      type: "image_to_model",
      model_version: "v2.5-20250123",
      file: {
        type: fileType,
        file_token: imageToken,
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

    if (data.data.status === "success") {
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
      throw new Error("Tripo task failed - the image may not be suitable for 3D conversion");
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  throw new Error("Task timed out after maximum attempts");
}

async function downloadAndStoreModel(
  supabaseUrl: string,
  serviceRoleKey: string,
  tripoModelUrl: string,
  taskId: string
): Promise<string> {
  console.log("Downloading GLB model from Tripo...");
  
  // Fetch the GLB file from Tripo
  const response = await fetch(tripoModelUrl);
  if (!response.ok) {
    throw new Error(`Failed to download model: ${response.status}`);
  }
  
  const modelBlob = await response.blob();
  console.log(`Model downloaded: ${modelBlob.size} bytes`);
  
  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  
  // Upload to Supabase storage
  const fileName = `${taskId}.glb`;
  const { data, error } = await supabase.storage
    .from("3d-models")
    .upload(fileName, modelBlob, {
      contentType: "model/gltf-binary",
      upsert: true,
    });
  
  if (error) {
    console.error("Storage upload error:", error);
    throw new Error(`Failed to upload model to storage: ${error.message}`);
  }
  
  console.log("Model uploaded to storage:", data.path);
  
  // Get public URL
  const { data: publicUrlData } = supabase.storage
    .from("3d-models")
    .getPublicUrl(fileName);
  
  console.log("Public URL:", publicUrlData.publicUrl);
  return publicUrlData.publicUrl;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const TRIPO_API_KEY = Deno.env.get("TRIPO_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!TRIPO_API_KEY) {
      throw new Error("TRIPO_API_KEY is not configured");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
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

    // Step 1: Fetch the image
    const { blob, fileType } = await fetchImageAsBlob(imageUrl);
    
    // Step 2: Upload to Tripo to get image_token
    const imageToken = await uploadImageToTripo(TRIPO_API_KEY, blob);
    
    // Step 3: Create the task with the image_token
    const taskId = await createTripoTask(TRIPO_API_KEY, imageToken, fileType);
    
    // Step 4: Poll for completion
    const tripoModelUrl = await pollTaskStatus(TRIPO_API_KEY, taskId);
    
    // Step 5: Download GLB and store in Supabase storage
    const publicModelUrl = await downloadAndStoreModel(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      tripoModelUrl,
      taskId
    );

    return new Response(
      JSON.stringify({ 
        success: true, 
        modelUrl: publicModelUrl,
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
