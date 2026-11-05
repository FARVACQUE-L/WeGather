import {
  type DependencyList,
  type RefObject,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

const COMPACT_BUTTON_WIDTH = 40;
const MOBILE_QUERY = "(max-width: 428px)";

const readGap = (element: Element) =>
  Number.parseFloat(getComputedStyle(element).columnGap) || 0;

export function useCompactLevel(
  headerRef: RefObject<HTMLElement | null>,
  titleRef: RefObject<HTMLElement | null>,
  buttonRefs: RefObject<HTMLElement | null>[],
  deps: DependencyList,
  mobileLevel = 0,
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
        setLevel(mobileLevel);
        return;
      }

      const buttons = buttonRefs.map((ref) => ref.current);
      buttons.forEach((button, index) => {
        if (button && index >= level) {
          fullWidths.current[index] = button.offsetWidth;
        }
      });

      if (
        buttons.some(
          (button, index) => button && fullWidths.current[index] === undefined,
        )
      ) {
        setLevel(0);
        return;
      }

      const actions = buttons.find(Boolean)?.parentElement;
      const headerGap = readGap(header);
      const actionsGap = actions ? readGap(actions) : 0;
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
  }, [level, mobileLevel, ...deps]);

  return level;
}
