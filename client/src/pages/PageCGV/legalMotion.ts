// Animations des pages légales (CGU/CGV, mentions légales, confidentialité),
// dans le style du reste du site : le titre descend au chargement, puis
// chaque section apparaît en fondu en glissant vers le haut, une seule fois,
// quand elle entre à l'écran.

export const titleIn = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
} as const;

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.4, delay: 0.1 },
} as const;

// amount bas : certaines sections sont plus hautes que l'écran.
export const revealOnScroll = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.1 },
  transition: { duration: 0.5, ease: "easeOut" },
} as const;
