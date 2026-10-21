import {
  type DependencyList,
  type RefObject,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

// Taille des boutons réduits à leur icône (rond de 40px, voir Galerie.css).
const COMPACT_BUTTON_WIDTH = 40;
// Sous 428px, Ajouter une photo devient un bouton flottant hors de l'en-tête :
// seul le premier bouton est réduit, quelle que soit la place.
const MOBILE_QUERY = "(max-width: 428px)";

// Nombre de boutons de l'en-tête à réduire à leur icône pour qu'ils ne
// touchent pas le titre, dans l'ordre de `buttonRefs` : d'abord le premier,
// puis le suivant s'il manque encore de la place. Le titre doit garder sa
// largeur naturelle dans scrollWidth (white-space: nowrap, overflow: hidden).
//
// La largeur d'un bouton avec son libellé ne se mesure que quand il est
// affiché en entier : elle est mémorisée, sinon le bouton réduit paraîtrait
// tenir, s'élargirait, retoucherait le titre et clignoterait.
export function useCompactLevel(
  headerRef: RefObject<HTMLElement | null>,
  titleRef: RefObject<HTMLElement | null>,
  buttonRefs: RefObject<HTMLElement | null>[],
  deps: DependencyList,
) {
  const [level, setLevel] = useState(0);
  const fullWidths = useRef<(number | undefined)[]>([]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: les refs sont stables, deps liste ce qui change la place prise.
  useLayoutEffect(() => {
    const header = headerRef.current;
    const title = titleRef.current;
    if (!header || !title) return;

    const measure = () => {
      if (window.matchMedia(MOBILE_QUERY).matches) {
        setLevel(1);
        return;
      }

      const buttons = buttonRefs.map((ref) => ref.current);
      buttons.forEach((button, index) => {
        if (button && index >= level) {
          fullWidths.current[index] = button.offsetWidth;
        }
      });

      // Un bouton apparu pendant qu'il était réduit n'a jamais été mesuré en
      // entier : on réaffiche tout pour le mesurer au rendu suivant.
      if (
        buttons.some(
          (button, index) => button && fullWidths.current[index] === undefined,
        )
      ) {
        setLevel(0);
        return;
      }

      const actions = buttons.find(Boolean)?.parentElement;
      const headerGap = Number.parseFloat(getComputedStyle(header).columnGap);
      const actionsGap = actions
        ? Number.parseFloat(getComputedStyle(actions).columnGap)
        : 0;
      const present = buttons.flatMap((button, index) =>
        button ? [index] : [],
      );

      const neededWidth = (compacted: number) =>
        title.scrollWidth +
        headerGap +
        present.reduce(
          (total, index) =>
            total +
            (index < compacted
              ? COMPACT_BUTTON_WIDTH
              : (fullWidths.current[index] ?? 0)),
          0,
        ) +
        actionsGap * Math.max(present.length - 1, 0);

      let next = 0;
      while (next < buttons.length && neededWidth(next) > header.clientWidth) {
        next++;
      }
      setLevel(next);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    return () => observer.disconnect();
  }, [level, ...deps]);

  return level;
}
