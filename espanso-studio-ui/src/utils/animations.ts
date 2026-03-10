import type { Variants } from "framer-motion";

export const springConfig = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

export const pageVariants: Variants = {
  initial: { opacity: 0, scale: 0.98, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0, transition: springConfig },
  exit: { opacity: 0, scale: 0.98, y: -10, transition: { duration: 0.2 } },
};

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: springConfig },
};

export const tapScale = 0.95;
export const hoverScale = 1.02;

export const buttonVariants: Variants = {
  hover: { scale: hoverScale },
  tap: { scale: tapScale },
};
