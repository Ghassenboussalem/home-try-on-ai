-- Create table to cache generated 3D models
CREATE TABLE public.generated_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url TEXT NOT NULL UNIQUE,
  model_url TEXT NOT NULL,
  task_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.generated_models ENABLE ROW LEVEL SECURITY;

-- Allow public read access (models are not user-specific)
CREATE POLICY "Anyone can view generated models"
ON public.generated_models FOR SELECT
USING (true);

-- Service role can insert/update (from edge function)
CREATE POLICY "Service role can insert models"
ON public.generated_models FOR INSERT
WITH CHECK (true);

-- Create index for fast lookups by image URL
CREATE INDEX idx_generated_models_image_url ON public.generated_models(image_url);