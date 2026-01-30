import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Upload, 
  Camera, 
  Loader2, 
  Check, 
  X, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  Image as ImageIcon,
  MapPin,
  Wand2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Product } from "@/data/products";
import { products as allProducts } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RoomVisualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SelectedProductWithPlacement {
  product: Product;
  placement: string;
}

const placementOptions = [
  "in the center of the room",
  "against the main wall",
  "near the window",
  "in the corner",
  "facing the entrance",
  "next to the existing furniture",
];

type Step = "select-products" | "upload-room" | "place-items" | "generating" | "result";

const RoomVisualizerModal = ({ isOpen, onClose }: RoomVisualizerModalProps) => {
  const [step, setStep] = useState<Step>("select-products");
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [roomFile, setRoomFile] = useState<File | null>(null);
  const [placementIndex, setPlacementIndex] = useState(0);
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setStep("select-products");
    setSelectedProducts([]);
    setRoomImage(null);
    setRoomFile(null);
    setPlacementIndex(0);
    setPlacements({});
    setIsGenerating(false);
    setResultImage(null);
    setError(null);
  }, []);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const toggleProductSelection = (product: Product) => {
    setSelectedProducts((prev) => {
      if (prev.find((p) => p.id === product.id)) {
        return prev.filter((p) => p.id !== product.id);
      }
      if (prev.length >= 4) {
        toast.error("You can select up to 4 products");
        return prev;
      }
      return [...prev, product];
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }

    setRoomFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setRoomImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadRoomImage = async (): Promise<string> => {
    if (!roomFile) throw new Error("No room image selected");

    const fileName = `room-${Date.now()}-${roomFile.name}`;
    const { data, error } = await supabase.storage
      .from("3d-models")
      .upload(fileName, roomFile, {
        contentType: roomFile.type,
        upsert: true,
      });

    if (error) throw new Error(`Failed to upload room image: ${error.message}`);

    const { data: publicUrlData } = supabase.storage
      .from("3d-models")
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  };

  const handlePlacementSelect = (placement: string) => {
    const currentProduct = selectedProducts[placementIndex];
    setPlacements((prev) => ({
      ...prev,
      [currentProduct.id]: placement,
    }));

    if (placementIndex < selectedProducts.length - 1) {
      setPlacementIndex((prev) => prev + 1);
    } else {
      // All placements done, start generating
      generateVisualization();
    }
  };

  const generateVisualization = async () => {
    setStep("generating");
    setIsGenerating(true);
    setError(null);

    try {
      // Upload room image to storage first
      const roomImageUrl = await uploadRoomImage();

      // Prepare products with placements
      const productsWithPlacements = selectedProducts.map((p) => ({
        id: p.id,
        name: p.name,
        image: p.image,
        placement: placements[p.id] || "in the room",
      }));

      toast.info("Generating your room visualization... This may take 1-2 minutes.");

      const { data, error } = await supabase.functions.invoke("room-visualizer", {
        body: {
          roomImageUrl,
          products: productsWithPlacements,
          aspectRatio: "auto",
        },
      });

      if (error) throw error;

      if (data?.resultUrl) {
        setResultImage(data.resultUrl);
        setStep("result");
        toast.success("Room visualization complete!");
      } else if (data?.error) {
        throw new Error(data.error);
      } else {
        throw new Error("No result received");
      }
    } catch (err) {
      console.error("Visualization error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate visualization");
      toast.error("Failed to generate visualization. Please try again.");
      setStep("place-items");
    } finally {
      setIsGenerating(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case "select-products":
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Select up to 4 products you want to visualize in your room
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2">
              {allProducts.map((product) => {
                const isSelected = selectedProducts.find((p) => p.id === product.id);
                return (
                  <motion.button
                    key={product.id}
                    onClick={() => toggleProductSelection(product)}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-muted-foreground"
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="aspect-square">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white text-xs font-medium truncate">
                        {product.name}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
            <div className="flex justify-between items-center pt-4">
              <span className="text-sm text-muted-foreground">
                {selectedProducts.length} of 4 products selected
              </span>
              <Button
                onClick={() => setStep("upload-room")}
                disabled={selectedProducts.length === 0}
                className="gap-2"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );

      case "upload-room":
        return (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Upload a photo of your room where you want to place the furniture
            </p>
            {roomImage ? (
              <div className="relative rounded-xl overflow-hidden">
                <img
                  src={roomImage}
                  alt="Your room"
                  className="w-full aspect-video object-cover"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setRoomImage(null);
                    setRoomFile(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full aspect-video rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 bg-muted/30 cursor-pointer transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <div className="flex gap-2">
                    <Upload className="w-8 h-8" />
                    <Camera className="w-8 h-8" />
                  </div>
                  <span className="text-sm font-medium">
                    Tap to upload or take a photo
                  </span>
                  <span className="text-xs">JPEG, PNG, WebP up to 10MB</span>
                </div>
              </label>
            )}
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep("select-products")}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => setStep("place-items")}
                disabled={!roomImage}
                className="gap-2"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );

      case "place-items":
        const currentProduct = selectedProducts[placementIndex];
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>
                Placing item {placementIndex + 1} of {selectedProducts.length}
              </span>
            </div>
            <div className="flex gap-4">
              <div className="w-32 h-32 rounded-xl overflow-hidden flex-shrink-0">
                <img
                  src={currentProduct.image}
                  alt={currentProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{currentProduct.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Where would you like to place this item?
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {placementOptions.map((option) => (
                <Button
                  key={option}
                  variant="outline"
                  className="h-auto py-3 text-left justify-start"
                  onClick={() => handlePlacementSelect(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  if (placementIndex > 0) {
                    setPlacementIndex((prev) => prev - 1);
                  } else {
                    setStep("upload-room");
                  }
                }}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </div>
        );

      case "generating":
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Wand2 className="w-10 h-10 text-primary animate-pulse" />
              </div>
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-foreground">Creating Your Vision</h3>
              <p className="text-sm text-muted-foreground mt-1">
                AI is placing furniture in your room...
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                This usually takes 1-2 minutes
              </p>
            </div>
          </div>
        );

      case "result":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="w-5 h-5" />
              <span className="font-medium">Your Room Visualization</span>
            </div>
            {resultImage && (
              <div className="rounded-xl overflow-hidden">
                <img
                  src={resultImage}
                  alt="Room visualization result"
                  className="w-full aspect-video object-cover"
                />
              </div>
            )}
            {error && (
              <div className="p-4 bg-destructive/10 rounded-xl text-destructive text-sm">
                {error}
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={resetState}>
                Try Again
              </Button>
              {resultImage && (
                <Button
                  className="flex-1"
                  onClick={() => window.open(resultImage, "_blank")}
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Download
                </Button>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" />
            AI Room Visualizer
          </DialogTitle>
        </DialogHeader>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default RoomVisualizerModal;
