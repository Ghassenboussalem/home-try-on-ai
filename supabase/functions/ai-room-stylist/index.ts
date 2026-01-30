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
  dimensions: string;
}

interface RoomStyleRequest {
  product: Product;
  roomType?: string;
  style?: string;
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

    const { product, roomType = "living room", style = "modern" }: RoomStyleRequest = await req.json();

    console.log("Generating room styling suggestions for:", product.name);
    console.log("Room type:", roomType, "Style:", style);

    const systemPrompt = `You are an expert interior designer AI assistant. Your role is to provide creative, practical room styling suggestions that help customers visualize how furniture pieces will look in their homes.

When given a furniture piece, you should:
1. Suggest complementary colors for walls and accents
2. Recommend lighting styles that work well
3. Suggest flooring types that complement the piece
4. Recommend complementary decor items
5. Provide tips for furniture placement

Keep responses concise, practical, and inspiring. Use bullet points for easy reading.`;

    const userPrompt = `I'm considering the "${product.name}" for my ${roomType}. Here are the details:
- Description: ${product.description}
- Material: ${product.material}
- Available colors: ${product.colors.join(", ")}
- Dimensions: ${product.dimensions}
- Price: $${product.price}

Please provide styling suggestions for a ${style} ${roomType} that would complement this piece. Include:
1. Wall color recommendations (2-3 colors)
2. Lighting suggestions
3. Flooring ideas
4. 3-4 complementary decor items
5. Placement tips

Keep it concise and actionable.`;

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
    const suggestion = data.choices?.[0]?.message?.content;

    if (!suggestion) {
      throw new Error("No suggestion received from AI");
    }

    console.log("Successfully generated room styling suggestions");

    return new Response(
      JSON.stringify({ suggestion, roomType, style }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-room-stylist:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
