/* ==========================================================
   LIGAÇÃO COM O SUPABASE. Estes dados ficam guardados só aqui
   e são usados por todas as páginas (site, login e admin).

   ATENÇÃO: aqui só entra a chave PÚBLICA (publishable). Ela pode
   ficar visível sem risco, porque quem protege os dados é a
   tranca (RLS) do banco. NUNCA coloque chave secreta neste arquivo.
   ========================================================== */
window.BANCO = {
  url: "https://ifiheuftjjxkfcowllzl.supabase.co",
  chave: "sb_publishable_n7YNi9ZrgNm31Bj2Ws9-PQ_OrhLdNxQ",
  dona: "iamfernandadias@gmail.com"   /* e-mail do login do admin */
};

/* Nas páginas que carregam o Supabase por CDN (login e admin),
   criamos aqui o cliente pronto para usar: window.sb */
if (window.supabase && typeof window.supabase.createClient === "function") {
  window.sb = window.supabase.createClient(window.BANCO.url, window.BANCO.chave, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
}
