INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;
CREATE POLICY smartqueue_avatar_select ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE POLICY smartqueue_avatar_insert ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE POLICY smartqueue_avatar_delete ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
