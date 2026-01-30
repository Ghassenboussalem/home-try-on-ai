import { X, Box, Ruler, Palette, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Product } from "@/data/products";
import RoomStylistPanel from "./RoomStylistPanel";
import SmartRecommendations from "./SmartRecommendations";

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onViewAR: (product: Product) => void;
}

const ProductDetailModal = ({ product, isOpen, onClose, onViewAR }: ProductDetailModalProps) => {
  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-auto md:top-[5vh] md:left-1/2 md:-translate-x-1/2 md:max-w-5xl md:w-[calc(100%-2rem)] md:max-h-[90vh] bg-card rounded-3xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-background/80 hover:bg-background transition-colors z-10"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>

            <div className="flex flex-col lg:flex-row h-full overflow-auto">
              {/* Image */}
              <div className="lg:w-2/5 aspect-square lg:aspect-auto flex-shrink-0">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="lg:w-3/5 p-6 md:p-8 flex flex-col lg:flex-row gap-6 overflow-auto">
                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h2 className="font-serif text-3xl text-foreground mb-2">
                    {product.name}
                  </h2>
                  <p className="text-2xl font-semibold text-primary mb-4">
                    ${product.price.toLocaleString()}
                  </p>

                  <p className="text-muted-foreground mb-4 leading-relaxed text-sm">
                    {product.description}
                  </p>

                  {/* Specs */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Ruler className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Dimensions</p>
                        <p className="text-sm text-muted-foreground">{product.dimensions}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Box className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Material</p>
                        <p className="text-sm text-muted-foreground">{product.material}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Palette className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Available Colors</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {product.colors.map((color) => (
                            <span
                              key={color}
                              className="px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground"
                            >
                              {color}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-4">
                    {["Free delivery & setup", "5-year warranty", "100-day trial"].map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-primary" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t border-border">
                    <button
                      onClick={() => onViewAR(product)}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
                    >
                      <Box className="w-5 h-5" />
                      View in AR
                    </button>
                    <button className="px-6 py-3 bg-secondary text-secondary-foreground rounded-xl font-medium hover:bg-secondary/80 transition-colors">
                      Add to Cart
                    </button>
                  </div>
                </div>

                {/* AI Features Sidebar */}
                <div className="lg:w-72 flex-shrink-0 space-y-4">
                  <RoomStylistPanel product={product} />
                  <SmartRecommendations
                    currentProduct={product}
                    onViewDetails={() => {}}
                    onViewAR={onViewAR}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProductDetailModal;
