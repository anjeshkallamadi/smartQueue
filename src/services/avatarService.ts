import { supabase } from "../lib/supabase";
import type { ImagePickerAsset } from "expo-image-picker";
const BUCKET = "avatars";
const MAX_BYTES = 5 * 1024 * 1024;
export function errorMessage(error: unknown): string {
  return error && typeof error === "object" && "message" in error
    ? String(error.message) : "Please try again.";
}
export async function getAvatarUrl(user: { id: string; user_metadata?: Record<string, unknown> }): Promise<string | null> {
  const path = user.user_metadata?.avatar_path;
  if (typeof path !== "string" || !path.startsWith(user.id + "/")) return null;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}
// Decode directly to ArrayBuffer: no React Native Blob or extra dependency.
function decodeBase64(input: string): ArrayBuffer {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const clean = input.replace(/\s/g, "").replace(/=+$/, "");
  const size = Math.floor(clean.length * 6 / 8);
  if (!size || size > MAX_BYTES) throw new Error("Choose an image smaller than 5 MB.");
  const out = new Uint8Array(size);
  let acc = 0, bits = 0, j = 0;
  for (const ch of clean) {
    const n = chars.indexOf(ch);
    if (n < 0) throw new Error("The selected image could not be decoded.");
    acc = (acc << 6) | n;
    bits += 6;
    if (bits >= 8) { bits -= 8; out[j++] = (acc >> bits) & 255; }
  }
  return out.buffer;
}
export async function uploadAvatar(asset: ImagePickerAsset): Promise<string> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Please sign in again.");
  if (!asset.base64) throw new Error("Could not read the selected image. Choose another photo.");
  const bytes = decodeBase64(asset.base64);
  // Expo ImagePicker returns JPEG base64 for edited images; check actual file signature.
  const header = new Uint8Array(bytes, 0, Math.min(bytes.byteLength, 12));
  const isJpeg = header[0] === 255 && header[1] === 216 && header[2] === 255;
  const isPng = header[0] === 137 && header[1] === 80 && header[2] === 78 && header[3] === 71;
  const isWebp = header[0] === 82 && header[1] === 73 && header[2] === 70 && header[3] === 70 && header[8] === 87 && header[9] === 69 && header[10] === 66 && header[11] === 80;
  if (!isJpeg && !isPng && !isWebp) throw new Error("Choose a JPEG, PNG or WebP photo.");
  const ext = isJpeg ? "jpg" : isPng ? "png" : "webp";
  const path = user.id + "/profile-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10) + "." + ext;
  const bucket = supabase.storage.from(BUCKET);
  const { error: uploadError } = await bucket.upload(path, bytes, { contentType: isJpeg ? "image/jpeg" : isPng ? "image/png" : "image/webp", upsert: false });
  if (uploadError) throw uploadError;
  const { data: signed, error: signError } = await bucket.createSignedUrl(path, 3600);
  if (signError) { await bucket.remove([path]); throw signError; }
  const { error: updateError } = await supabase.auth.updateUser({ data: { avatar_path: path, avatar_url: null } });
  if (updateError) { await bucket.remove([path]); throw updateError; }
  const previous = user.user_metadata?.avatar_path;
  if (typeof previous === "string" && previous.startsWith(user.id + "/") && previous !== path) {
    // Best effort cleanup after metadata is safely updated.
    try { await bucket.remove([previous]); } catch { /* retain successful new photo */ }
  }
  return signed.signedUrl;
}
