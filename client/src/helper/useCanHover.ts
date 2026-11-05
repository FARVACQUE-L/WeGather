import { useEffect, useState } from "react";

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
