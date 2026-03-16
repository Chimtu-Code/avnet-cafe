const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Upload a file to Cloudinary.
 * Returns { url, publicId } — store BOTH in your database.
 * The url is what users see. The publicId is what you need to delete later.
 *
 * @param {File} file
 * @returns {Promise<{ url: string, publicId: string }>}
 */
export async function uploadToCloudinary(file) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Missing VITE_CLOUDINARY_CLOUD_NAME or VITE_CLOUDINARY_UPLOAD_PRESET in .env');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'avnet-cafe/items');

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? 'Cloudinary upload failed');
  }

  const data = await res.json();
  return {
    url: buildOptimisedUrl(data.public_id),
    publicId: data.public_id,
  };
}

/**
 * Delete an image from Cloudinary via the Supabase Edge Function.
 * The Edge Function holds the API secret — never exposed to the browser.
 *
 * @param {string} publicId - stored in items.image_public_id column
 * @returns {Promise<void>}
 */
export async function deleteFromCloudinary(publicId) {
  if (!publicId) return; // nothing to delete

  try {
    await fetch(
      `${SUPABASE_URL}/functions/v1/delete-cloudinary-image`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ publicId }),
      }
    );
  } catch (err) {
    // Non-blocking — if delete fails the image just sits unused in Cloudinary.
    // It won't affect users since the DB no longer references it.
    console.warn('[deleteFromCloudinary] failed:', err.message);
  }
}

export function buildOptimisedUrl(publicId) {
  // w_400   — food cards are ~130px wide on mobile, 400px is generous
  // q_auto:low — Cloudinary's lowest quality preset, still looks fine for thumbnails
  // f_auto  — WebP for modern browsers, JPEG fallback
  // c_fill  — crop to exact dimensions rather than just limiting
  // h_400   — square crop keeps all cards uniform
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_400,h_400,c_fill,q_auto:low,f_auto/${publicId}`;
}