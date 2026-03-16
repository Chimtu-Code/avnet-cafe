/**
 * uploadToCloudinary
 *
 * Uploads an image file to Cloudinary using an unsigned upload preset.
 * No API secret needed in the frontend — the preset handles auth.
 *
 * Returns a delivery URL with automatic transformations baked in:
 * - Max width 800px
 * - Quality auto (Cloudinary picks the best quality/size tradeoff)
 * - Format auto (serves WebP to browsers that support it, JPEG otherwise)
 *
 * A 3MB JPEG upload → served as ~40KB WebP to the user.
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * @param {File} file - Image file from input
 * @returns {Promise<string>} - Optimised delivery URL
 */
export async function uploadToCloudinary(file) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'Missing VITE_CLOUDINARY_CLOUD_NAME or VITE_CLOUDINARY_UPLOAD_PRESET in .env'
    );
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  // Store in a dedicated folder so your Cloudinary media library stays organised
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

  // Return an optimised URL instead of the raw uploaded URL.
  // Transformations applied via URL parameters — no extra cost, happens at CDN edge:
  //   w_800     → max 800px wide
  //   q_auto    → automatic quality (Cloudinary's ML picks the best tradeoff)
  //   f_auto    → WebP for modern browsers, JPEG fallback
  //   c_limit   → only downscale, never upscale small images
  const optimisedUrl = buildOptimisedUrl(data.public_id);
  return optimisedUrl;
}

/**
 * Builds an optimised delivery URL for any existing Cloudinary public_id.
 * Call this if you want to re-generate URLs for your 94 existing images
 * after migrating them to Cloudinary.
 *
 * @param {string} publicId - Cloudinary public_id from upload response
 * @returns {string} - Optimised delivery URL
 */
export function buildOptimisedUrl(publicId) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_800,q_auto,f_auto,c_limit/${publicId}`;
}