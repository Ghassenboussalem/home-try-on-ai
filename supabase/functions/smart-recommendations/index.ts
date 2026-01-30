import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  material: string;
  colors: string[];
}

interface RecommendationRequest {
  currentProduct: Product;
  allProducts: Product[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { currentProduct, allProducts }: RecommendationRequest = await req.json();

    console.log("Getting recommendations based on:", currentProduct.name);

    // Filter out the current product
    const otherProducts = allProducts.filter((p) => p.id !== currentProduct.id);

    const systemPrompt = `You are a furniture recommendation AI. Your role is to analyze a customer's current product interest and suggest complementary items from the available catalog.

You must return a valid JSON array of product IDs that you recommend, along with a brief reason for each recommendation.

Response format (JSON only, no markdown):
[
  { "productId": "2", "reason": "Brief explanation of why this complements the current selection" },
  { "productId": "3", "reason": "Another brief explanation" }
]

Return 2-3 recommendations maximum. Only return the JSON, nothing else.`;

    const catalogDescription = otherProducts
      .map((p) => `ID: ${p.id}, Name: ${p.name}, Description: ${p.description}, Material: ${p.material}, Colors: ${p.colors.join(", ")}, Price: $${p.price}`)
      .join("\n");

    const userPrompt = `Customer is viewing:
Name: ${currentProduct.name}
Description: ${currentProduct.description}
Material: ${currentProduct.material}
Colors: ${currentProduct.colors.join(", ")}
Price: $${currentProduct.price}

Available products to recommend:
${catalogDescription}

Based on style compatibility, color coordination, and complementary design, which products would you recommend? Return only the JSON array.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No recommendation received from AI");
    }

    // Clean up potential markdown formatting
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let recommendations;
    try {
      recommendations = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      // Fallback: return first 2 products as recommendations
      recommendations = otherProducts.slice(0, 2).map((p) => ({
        productId: p.id,
        reason: `Complements your ${currentProduct.name} selection`,
      }));
    }

    // Enrich recommendations with full product data
    const enrichedRecommendations = recommendations
      .map((rec: { productId: string; reason: string }) => {
        const product = allProducts.find((p) => p.id === rec.productId);
        if (!product) return null;
        return {
          product,
          reason: rec.reason,
        };
      })
      .filter(Boolean);

    console.log("Successfully generated", enrichedRecommendations.length, "recommendations");

    return new Response(
      JSON.stringify({ recommendations: enrichedRecommendations }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in smart-recommendations:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
