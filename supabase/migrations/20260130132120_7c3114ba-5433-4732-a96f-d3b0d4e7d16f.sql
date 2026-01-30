-- Create storage bucket for 3D models
INSERT INTO storage.buckets (id, name, public)
VALUES ('3d-models', '3d-models', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to 3D models
CREATE POLICY "Public read access for 3D models"
ON storage.objects FOR SELECT
USING (bucket_id = '3d-models');

-- Allow service role to upload models (from edge function)
CREATE POLICY "Service role can upload 3D models"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = '3d-models');

CREATE POLICY "Service role can update 3D models"
ON storage.objects FOR UPDATE
USING (bucket_id = '3d-models');

CREATE POLICY "Service role can delete 3D models"
ON storage.objects FOR DELETE
USING (bucket_id = '3d-models');