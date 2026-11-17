// Adresse du serveur WeGather. EXPO_PUBLIC_API_URL (dans mobile/.env.local)
// permet de viser un serveur local pendant le développement.
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "https://wegather.fr";

// Site web, ouvert pour les pages pas encore présentes dans l'app
// (inscription, mot de passe oublié).
export const SITE_URL = "https://wegather.fr";
