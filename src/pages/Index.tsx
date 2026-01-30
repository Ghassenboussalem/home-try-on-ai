import { useState } from "react";
import HeroSection from "@/components/HeroSection";
import ProductGrid from "@/components/ProductGrid";
import ProductDetailModal from "@/components/ProductDetailModal";
import ARViewer from "@/components/ARViewer";
import type { Product } from "@/data/products";

const Index = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAROpen, setIsAROpen] = useState(false);

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailOpen(true);
  };

  const handleViewAR = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailOpen(false);
    setIsAROpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailOpen(false);
  };

  const handleCloseAR = () => {
    setIsAROpen(false);
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-serif text-lg">V</span>
            </div>
            <span className="font-serif text-xl text-foreground">Vivo</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#products" className="text-muted-foreground hover:text-foreground transition-colors">
              Collection
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </a>
          </nav>
          <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-full text-sm font-medium hover:bg-secondary/80 transition-colors">
            Contact
          </button>
        </div>
      </header>

      {/* Hero */}
      <HeroSection />

      {/* Products */}
      <ProductGrid onViewDetails={handleViewDetails} onViewAR={handleViewAR} />

      {/* Footer */}
      <footer className="py-16 px-6 bg-muted/50">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-serif text-lg">V</span>
              </div>
              <span className="font-serif text-xl text-foreground">Vivo</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2024 Vivo Furniture. AR-powered shopping experience.
            </p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        onViewAR={handleViewAR}
      />

      <ARViewer
        product={selectedProduct}
        isOpen={isAROpen}
        onClose={handleCloseAR}
      />
    </main>
  );
};

export default Index;
