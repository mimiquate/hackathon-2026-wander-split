// A single leading slash, never "//host" (protocol-relative) or "/\host"
// (some browsers treat a leading backslash the same way) — both of which
// would send a post-login redirect off-site.
const SAFE_RELATIVE_PATH = /^\/(?!\/|\\)/;

/** True for a same-origin path safe to pass to redirect() after login —
 * used to validate the "next" param threaded through login/signup so an
 * invite link (or any other flow) can return the user where they came from. */
export function isSafeRedirectPath(path: string): boolean {
  return SAFE_RELATIVE_PATH.test(path);
}
