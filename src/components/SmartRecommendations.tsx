import { useState, useEffect } from "react";
import { Sparkles, Loader2, Eye, Box } from "lucide-react";
import { motion } from "framer-motion";
import type { Product } from "@/data/products";
import { products } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";

interface SmartRecommendationsProps {
  currentProduct: Product;
  onViewDetails: (product: Product) => void;
  onViewAR: (product: Product) => void;
}

interface Recommendation {
  product: Product;
  reason: string;
}

const SmartRecommendations = ({
  currentProduct,
  onViewDetails,
  onViewAR,
}: SmartRecommendationsProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  useEffect(() => {
    getRecommendations();
  }, [currentProduct.id]);

  const getRecommendations = async () => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("smart-recommendations", {
        body: {
          currentProduct,
          allProducts: products,
        },
      });

      if (error) throw error;

      if (data?.recommendations) {
        setRecommendations(data.recommendations);
      }
    } catch (err) {
      console.error("Error getting recommendations:", err);
      // Fallback to basic recommendations
      const fallback = products
        .filter((p) => p.id !== currentProduct.id)
        .slice(0, 2)
        .map((product) => ({
          product,
          reason: "Complements your selection",
        }));
      setRecommendations(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-muted/50 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-medium text-foreground">AI Recommendations</h3>
        </div>
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
          <span className="ml-2 text-sm text-muted-foreground">Finding matches...</span>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  return (
    <div className="bg-muted/50 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-medium text-foreground">You Might Also Like</h3>
      </div>

      <div className="space-y-3">
        {recommendations.map(({ product, reason }, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex gap-3 p-2 bg-background rounded-xl hover:shadow-md transition-shadow"
          >
            <img
              src={product.image}
              alt={product.name}
              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-foreground truncate">
                {product.name}
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                {reason}
              </p>
              <p className="text-sm font-semibold text-primary">
                ${product.price.toLocaleString()}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => onViewDetails(product)}
                className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                aria-label="View details"
              >
                <Eye className="w-3.5 h-3.5 text-foreground" />
              </button>
              <button
                onClick={() => onViewAR(product)}
                className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                aria-label="View in AR"
              >
                <Box className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SmartRecommendations;
