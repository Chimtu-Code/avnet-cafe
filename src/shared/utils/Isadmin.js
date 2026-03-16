/**
 * isAdmin — single source of truth for admin check.
 *
 * Checks user_metadata.role === 'admin' instead of a hardcoded email.
 * To grant admin access: Supabase dashboard → Auth → Users → Edit user
 * → Raw user meta data → add { "role": "admin" }
 *
 * This works for unlimited admin accounts with no code changes.
 *
 * @param {object} user - Supabase auth user object
 * @returns {boolean}
 */
export function isAdmin(user) {
  if (!user) return false;
  return user.user_metadata?.role === 'admin';
}