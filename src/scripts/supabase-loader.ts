/* Loads the Supabase client from our own bundle (no CDN), only when live.js asks for it.
   Vite turns the dynamic import into a separate hashed chunk under /_astro/. */
declare global {
  interface Window {
    __loadSupabase?: () => Promise<typeof import("@supabase/supabase-js")>;
  }
}
window.__loadSupabase = () => import("@supabase/supabase-js");
document.dispatchEvent(new Event("supabase-loader-ready"));
export {};
