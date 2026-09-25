import { useEffect, useState } from "react";

// Même règle que les blocs @media des fichiers CSS : pas d'effet de survol
// sur mobile (≤ 428px) ni sur un écran tactile. À utiliser pour désactiver
// les whileHover de framer-motion, que le CSS ne peut pas couper.
const QUERY = "(hover: hover) and (min-width: 429px)";

const useCanHover = () => {
  const [canHover, setCanHover] = useState(
    () => window.matchMedia(QUERY).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(QUERY);
    const onChange = () => setCanHover(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return canHover;
};

export default useCanHover;
