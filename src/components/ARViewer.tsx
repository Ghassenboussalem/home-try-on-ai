import { useState, useRef, useEffect } from "react";
import { X, Camera, RotateCcw, Move, Download, Share2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Product } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Declare model-viewer as a custom element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          alt?: string;
          ar?: boolean;
          "ar-modes"?: string;
          "camera-controls"?: boolean;
          "touch-action"?: string;
          "shadow-intensity"?: string;
          "auto-rotate"?: boolean;
          "environment-image"?: string;
          exposure?: string;
          poster?: string;
          loading?: string;
        },
        HTMLElement
      >;
    }
  }
}

interface ARViewerProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

type GenerationStatus = "idle" | "generating" | "ready" | "error";

const ARViewer = ({ product, isOpen, onClose }: ARViewerProps) => {
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const modelViewerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (isOpen && product && !modelUrl) {
      generateModel();
    }
  }, [isOpen, product]);

  useEffect(() => {
    if (!isOpen) {
      setStatus("idle");
      setModelUrl(null);
      setProgress(0);
    }
  }, [isOpen]);

  const generateModel = async () => {
    if (!product) return;
    
    setStatus("generating");
    setProgress(0);

    // Simulate progress while generating
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + Math.random() * 15, 90));
    }, 2000);

    try {
      const { data, error } = await supabase.functions.invoke("generate-3d-model", {
        body: { imageUrl: product.image, productName: product.name },
      });

      clearInterval(progressInterval);

      if (error) throw error;

      if (data?.modelUrl) {
        setModelUrl(data.modelUrl);
        setProgress(100);
        setStatus("ready");
        toast.success("3D model generated successfully!");
      } else {
        throw new Error("No model URL returned");
      }
    } catch (err) {
      clearInterval(progressInterval);
      console.error("Error generating model:", err);
      setStatus("error");
      toast.error("Failed to generate 3D model. Please try again.");
    }
  };

  const handleScreenshot = async () => {
    const modelViewer = modelViewerRef.current as any;
    if (!modelViewer?.toBlob) {
      toast.error("Screenshot not available");
      return;
    }

    try {
      const blob = await modelViewer.toBlob({ idealAspect: true });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${product?.name || "furniture"}-ar.png`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Screenshot saved!");
    } catch (err) {
      console.error("Screenshot error:", err);
      toast.error("Failed to capture screenshot");
    }
  };

  const handleShare = async () => {
    const modelViewer = modelViewerRef.current as any;
    if (!modelViewer?.toBlob) {
      toast.error("Share not available");
      return;
    }

    try {
      const blob = await modelViewer.toBlob({ idealAspect: true });
      const file = new File([blob], `${product?.name || "furniture"}-ar.png`, { type: "image/png" });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: product?.name,
          text: `Check out this ${product?.name} in AR!`,
          files: [file],
        });
      } else {
        // Fallback to download
        handleScreenshot();
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Share error:", err);
        toast.error("Failed to share");
      }
    }
  };

  const handleReset = () => {
    const modelViewer = modelViewerRef.current as any;
    if (modelViewer?.resetTurntableRotation) {
      modelViewer.resetTurntableRotation();
    }
  };

  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background z-50 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <h2 className="font-serif text-xl text-foreground">{product.name}</h2>
              <p className="text-sm text-muted-foreground">AR Visualization</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            >
              <X className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Main content */}
          <div className="flex-1 relative overflow-hidden">
            {status === "generating" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-10">
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-full border-4 border-muted">
                    <svg className="w-full h-full -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="44"
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="4"
                        strokeDasharray={`${progress * 2.76} 276`}
                        className="transition-all duration-300"
                      />
                    </svg>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                </div>
                <h3 className="font-serif text-2xl text-foreground mb-2">
                  Generating 3D Model
                </h3>
                <p className="text-muted-foreground text-center max-w-md px-4">
                  We're creating a detailed 3D model from the product image. 
                  This typically takes 30-60 seconds.
                </p>
                <p className="text-primary font-medium mt-4">{Math.round(progress)}%</p>
              </div>
            )}

            {status === "error" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background z-10 p-6">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                  <X className="w-8 h-8 text-destructive" />
                </div>
                <h3 className="font-serif text-2xl text-foreground mb-2">
                  Generation Failed
                </h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  We couldn't generate the 3D model. Please try again.
                </p>
                <button
                  onClick={generateModel}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  Try Again
                </button>
              </div>
            )}

            {status === "ready" && modelUrl && (
              <>

                <model-viewer
                  ref={modelViewerRef}
                  src={modelUrl}
                  alt={product.name}
                  ar
                  ar-modes="webxr scene-viewer quick-look"
                  camera-controls
                  touch-action="pan-y"
                  shadow-intensity="1"
                  auto-rotate
                  environment-image="neutral"
                  exposure="1"
                  style={{ width: "100%", height: "100%" }}
                />

                {/* AR Instructions */}
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 bg-foreground/80 text-background rounded-full text-sm">
                  <Move className="w-4 h-4 inline mr-2" />
                  Drag to rotate • Pinch to zoom
                </div>
              </>
            )}

            {status === "idle" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover opacity-30"
                />
              </div>
            )}
          </div>

          {/* Controls */}
          {status === "ready" && (
            <div className="p-4 border-t border-border">
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleReset}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-muted transition-colors"
                >
                  <RotateCcw className="w-5 h-5 text-foreground" />
                  <span className="text-xs text-muted-foreground">Reset</span>
                </button>
                <button
                  onClick={handleScreenshot}
                  className="flex flex-col items-center gap-1 p-4 bg-primary text-primary-foreground rounded-2xl hover:opacity-90 transition-opacity"
                >
                  <Camera className="w-6 h-6" />
                  <span className="text-xs font-medium">Screenshot</span>
                </button>
                <button
                  onClick={handleShare}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-muted transition-colors"
                >
                  <Share2 className="w-5 h-5 text-foreground" />
                  <span className="text-xs text-muted-foreground">Share</span>
                </button>
                <button
                  onClick={handleScreenshot}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-muted transition-colors"
                >
                  <Download className="w-5 h-5 text-foreground" />
                  <span className="text-xs text-muted-foreground">Save</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ARViewer;
