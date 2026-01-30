import { useState } from "react";
import { Wand2, Loader2, Home, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Product } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface RoomStylistPanelProps {
  product: Product;
}

const roomTypes = ["Living Room", "Bedroom", "Office", "Den", "Lounge"];
const styles = ["Modern", "Scandinavian", "Industrial", "Bohemian", "Minimalist"];

const RoomStylistPanel = ({ product }: RoomStylistPanelProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState("Living Room");
  const [selectedStyle, setSelectedStyle] = useState("Modern");

  const getStylingAdvice = async () => {
    setIsLoading(true);
    setSuggestion(null);

    try {
      const { data, error } = await supabase.functions.invoke("ai-room-stylist", {
        body: {
          product,
          roomType: selectedRoom.toLowerCase(),
          style: selectedStyle.toLowerCase(),
        },
      });

      if (error) throw error;

      if (data?.suggestion) {
        setSuggestion(data.suggestion);
      } else {
        throw new Error("No suggestion received");
      }
    } catch (err) {
      console.error("Error getting styling advice:", err);
      toast.error("Failed to get styling suggestions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-muted/50 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Wand2 className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-medium text-foreground">AI Room Stylist</h3>
      </div>

      {!suggestion ? (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            Get AI-powered styling suggestions for your space
          </p>

          <div className="space-y-3 mb-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Room Type
              </label>
              <div className="flex flex-wrap gap-1.5">
                {roomTypes.map((room) => (
                  <button
                    key={room}
                    onClick={() => setSelectedRoom(room)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      selectedRoom === room
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {room}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Design Style
              </label>
              <div className="flex flex-wrap gap-1.5">
                {styles.map((style) => (
                  <button
                    key={style}
                    onClick={() => setSelectedStyle(style)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      selectedStyle === style
                        ? "bg-primary text-primary-foreground"
                        : "bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={getStylingAdvice}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Get Styling Tips
              </>
            )}
          </button>
        </>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Home className="w-3 h-3" />
              {selectedRoom} • {selectedStyle}
            </div>
            <div className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-li:text-muted-foreground">
              <ReactMarkdown>{suggestion}</ReactMarkdown>
            </div>
            <button
              onClick={() => setSuggestion(null)}
              className="text-xs text-primary hover:underline"
            >
              Try different options
            </button>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default RoomStylistPanel;
