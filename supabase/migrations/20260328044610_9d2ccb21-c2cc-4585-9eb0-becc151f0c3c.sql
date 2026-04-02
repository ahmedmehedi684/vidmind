INSERT INTO storage.buckets (id, name, public) VALUES ('showcase-thumbnails', 'showcase-thumbnails', true);

CREATE POLICY "Public can view thumbnails" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'showcase-thumbnails');

CREATE POLICY "Admins can upload thumbnails" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'showcase-thumbnails' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete thumbnails" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'showcase-thumbnails' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update thumbnails" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'showcase-thumbnails' AND has_role(auth.uid(), 'admin'::app_role));