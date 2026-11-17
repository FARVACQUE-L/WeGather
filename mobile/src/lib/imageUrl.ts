import { API_URL } from "@/constants/config";

// Le serveur renvoie les images soit en chemin relatif ("/uploads/…"),
// soit en adresse absolue construite avec son propre domaine (en local
// "http://localhost:3310/uploads/…", injoignable depuis le téléphone).
// On garde seulement le chemin et on le rattache au serveur visé par l'app.
export const imageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;

  const uploadsIndex = path.indexOf("/uploads/");
  if (uploadsIndex !== -1) return `${API_URL}${path.slice(uploadsIndex)}`;

  return /^https?:/.test(path) ? path : `${API_URL}${path}`;
};
