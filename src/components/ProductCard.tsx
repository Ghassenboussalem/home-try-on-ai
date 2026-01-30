import { Eye, Box } from "lucide-react";
import { motion } from "framer-motion";
import type { Product } from "@/data/products";

interface ProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
  onViewAR: (product: Product) => void;
  index: number;
}

const ProductCard = ({ product, onViewDetails, onViewAR, index }: ProductCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative bg-card rounded-2xl overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-500"
    >
      {/* Image container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300" />
        
        {/* Quick actions */}
        <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={() => onViewDetails(product)}
            className="p-3 bg-card rounded-full shadow-lg hover:scale-110 transition-transform duration-200"
            aria-label="View details"
          >
            <Eye className="w-5 h-5 text-foreground" />
          </button>
          <button
            onClick={() => onViewAR(product)}
            className="p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-110 transition-transform duration-200"
            aria-label="View in AR"
          >
            <Box className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-serif text-xl text-foreground mb-1">{product.name}</h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{product.description}</p>
        
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-foreground">
            ${product.price.toLocaleString()}
          </span>
          <button
            onClick={() => onViewAR(product)}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-colors duration-300"
          >
            <Box className="w-4 h-4" />
            View in AR
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
