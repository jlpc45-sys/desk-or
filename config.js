/* ================================================================
   CONFIG DU DESK
   Réglages de départ. Le plus simple : bouton « Studio » dans le Desk.
   Tu peux aussi les modifier ici à la main (garde les guillemets et virgules).
   ================================================================ */
window.COCKPIT_CONFIG = {
  id: "gold",                    // identifiant interne (sauvegardes du navigateur)
  name: "captain",            // nom affiché en haut à gauche (« captain » = logo Captain Trading)
  tagline: "Gold · Desk",       // sous-titre sous le nom
  accent: "#D9A93C",             // couleur d'accent (toute l'interface suit) : or
  theme: "dark",                 // affichage au premier lancement : "dark" ou "light"
  beginner: false,               // true = boutons « ? » qui expliquent chaque module
  watchlist: [],                 // cryptos ajoutées dans la barre du haut (vide = aucune : le Desk est orienté métaux)
  modules: {                     // false = module masqué
    day: true, map: true, events: true, deriv: true, liq: true, movers: false, screener: false, news: true,
    levels: false, opts: false, book: false, corr: true, net: true, veille: true
  },
  layout: null,                  // disposition des blocs (réglée avec le bouton « Disposition »)
  moversMarket: "spot",          // top mouvements par défaut : "spot" ou "perp"
  moversMinVolume: 2000000,      // volume 24h minimum (en $) pour apparaître dans les tops
  liqMin: 25000,                 // liquidations affichées à partir de ce montant (en $)
  screenerPreset: "compression", // préréglage du screener au lancement
  screenerMax: 150,              // nombre de coins analysés (les plus liquides d'OKX)
  newsLang: "fr",                // "fr" = headlines traduites, "vo" = version originale
  agent: "https://desk-or.jlpc45.workers.dev", // adresse de TON relais Cloudflare (agent IA sur l'or), ex. "https://desk-or.mon-pseudo.workers.dev" ; vide = agent de Captain Trading (crypto)
  data: "https://captaincryptotrading21.github.io/desk"                       // adresse du site GitHub du Desk (robot : agenda, news crypto, FinancialJuice)
};
