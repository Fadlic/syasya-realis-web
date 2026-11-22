/* =====================================================================
   Studio — connection settings for the public website
   Fill these after creating your Supabase project
   (Dashboard → Settings → API Keys). The publishable key is meant to be public:
   database rules (RLS) decide what it can do — it can only SEND an enquiry
   and receive pop-ups addressed to that visitor.
   Leave both empty to run the site without a backend (form still opens
   WhatsApp / email, nothing is stored).
   ===================================================================== */
/* NEVER put the secret key (sb_secret_…) in this file. */
window.STUDIO_CONFIG = {
  supabaseUrl: "https://zshqcntmasszdqdeppru.supabase.co",          // e.g. "https://abcdefghijkl.supabase.co"
  supabaseAnonKey: "sb_publishable_tMxc5_sJQNr8WaQRPETI9w_MWvoRQi8",      // the PUBLISHABLE key: sb_publishable_…  (older projects: "anon public")
  livePopups: true,         // receive pop-ups sent from the admin board
  visitNotice: true         // show the one-line notice about anonymous visit data
};
