import ProductCard from "./ProductCard";
import { products, type Product } from "@/data/products";
import { motion } from "framer-motion";

interface ProductGridProps {
  onViewDetails: (product: Product) => void;
  onViewAR: (product: Product) => void;
}

const ProductGrid = ({ onViewDetails, onViewAR }: ProductGridProps) => {
  return (
    <section id="products" className="py-20 px-6 bg-background">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-4">
            Our Collection
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Curated sofas designed for modern living. Each piece is ready for AR visualization—
            see exactly how it fits in your space.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              onViewDetails={onViewDetails}
              onViewAR={onViewAR}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductGrid;
