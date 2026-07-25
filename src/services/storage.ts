import { supabase } from '../lib/supabase';

export type StorageBucket = 'news-images' | 'event-images' | 'member-photos' | 'board-photos' | 'project-images';

export async function uploadCmsImage(
  bucket: StorageBucket,
  file: File,
  folderId: string,
): Promise<{ url?: string; error?: string }> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${folderId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { error: uploadError.message };

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl };
}

export async function removeCmsImage(
  bucket: StorageBucket,
  publicUrl: string,
): Promise<{ error?: string }> {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return {};

  const path = publicUrl.slice(idx + marker.length);
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) return { error: error.message };
  return {};
}
