export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  dimensions: string;
  material: string;
  colors: string[];
  modelUrl?: string;
}

export const products: Product[] = [
  {
    id: "1",
    name: "Oslo Comfort Sofa",
    description: "A timeless 3-seat fabric sofa with plush cushioning and clean Scandinavian lines. Perfect for modern living spaces that value both comfort and style.",
    price: 1899,
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80",
    dimensions: "220cm × 90cm × 85cm",
    material: "Premium cotton-linen blend",
    colors: ["Warm Gray", "Oatmeal", "Sage Green"],
  },
  {
    id: "2",
    name: "Milano Leather Sectional",
    description: "Luxurious Italian-inspired leather sectional with generous seating and adjustable headrests. A statement piece for sophisticated interiors.",
    price: 3499,
    image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80",
    dimensions: "300cm × 180cm × 90cm",
    material: "Full-grain leather",
    colors: ["Cognac", "Charcoal", "Ivory"],
  },
  {
    id: "3",
    name: "Copenhagen Loveseat",
    description: "Mid-century modern loveseat with tapered oak legs and button-tufted back. Compact yet comfortable for intimate spaces.",
    price: 1299,
    image: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&q=80",
    dimensions: "150cm × 85cm × 80cm",
    material: "Velvet upholstery",
    colors: ["Dusty Rose", "Navy Blue", "Forest Green"],
  },
  {
    id: "4",
    name: "Modular Cloud Sofa",
    description: "Infinitely configurable modular sofa system. Each piece connects magnetically, letting you create the perfect arrangement for your space.",
    price: 2799,
    image: "https://images.unsplash.com/photo-1550254478-ead40cc54513?w=800&q=80",
    dimensions: "Variable configuration",
    material: "Performance fabric",
    colors: ["Cloud White", "Warm Taupe", "Midnight"],
  },
  {
    id: "5",
    name: "Studio Apartment Sofa",
    description: "Space-saving design with hidden storage and clean lines. Built for urban living without compromising on comfort or style.",
    price: 999,
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80",
    dimensions: "180cm × 80cm × 75cm",
    material: "Bouclé fabric",
    colors: ["Cream", "Slate", "Terracotta"],
  },
  {
    id: "6",
    name: "Vintage Revival Chesterfield",
    description: "Classic Chesterfield silhouette reimagined with modern proportions and sustainable materials. Deep diamond tufting and rolled arms.",
    price: 2299,
    image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&q=80",
    dimensions: "230cm × 95cm × 75cm",
    material: "Recycled leather blend",
    colors: ["British Tan", "Olive", "Burgundy"],
  },
];
