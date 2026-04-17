import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

type Variant = "header" | "hero" | "footer" | "testimonial";

const SRC: Record<Variant, string> = {
  header: "/logo-icon.png",
  hero: "/logo-hero.png",
  footer: "/logo-icon.png",
  testimonial: "/logo-icon.png",
};

type Props = {
  variant: Variant;
  className?: string;
  /** Extra classes on the <img> */
  imgClassName?: string;
};

export function BrandLogo({ variant, className, imgClassName }: Props) {
  const reduce = useReducedMotion();
  const [broken, setBroken] = useState(false);
  const src = SRC[variant];

  const imgSize =
    variant === "hero"
      ? "mx-auto h-auto w-full max-w-[min(100%,22rem)] object-contain sm:max-w-md lg:max-w-lg"
      : variant === "footer"
        ? "h-9 w-9 object-contain"
        : variant === "testimonial"
          ? "h-16 w-16 object-contain sm:h-20 sm:w-20"
          : "h-10 w-10 object-contain sm:h-11 sm:w-11";

  if (broken) {
    const fallbackBox =
      variant === "hero"
        ? "h-32 w-32 text-3xl sm:h-40 sm:w-40"
        : variant === "testimonial"
          ? "h-16 w-16 text-xl sm:h-20 sm:w-20"
          : variant === "footer"
            ? "h-9 w-9 text-sm"
            : "h-10 w-10 text-sm sm:h-11 sm:w-11";
    return (
      <div
        className={[
          "grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-navy to-sky-600 font-black text-white shadow-md",
          fallbackBox,
          className ?? "",
        ].join(" ")}
        aria-hidden
      >
        K
      </div>
    );
  }

  const floatLoop = reduce
    ? undefined
    : {
        y: [0, -7, 0],
        rotate: [0, 0.4, 0, -0.4, 0],
      };

  const floatTrans = reduce
    ? undefined
    : {
        duration: 4.8,
        repeat: Infinity,
        ease: "easeInOut" as const,
      };

  return (
    <motion.div
      className={["relative inline-flex shrink-0 select-none", className].filter(Boolean).join(" ")}
      animate={floatLoop}
      transition={floatTrans}
      whileHover={
        reduce
          ? undefined
          : {
              scale: 1.06,
              rotate: [0, -3, 3, 0],
              transition: { type: "spring", stiffness: 380, damping: 18 },
            }
      }
      whileTap={{ scale: 0.96 }}
    >
      <motion.img
        src={src}
        alt="Kasbnamo"
        width={variant === "hero" ? 512 : variant === "testimonial" ? 256 : 128}
        height={variant === "hero" ? 512 : variant === "testimonial" ? 256 : 128}
        decoding="async"
        draggable={false}
        className={[imgSize, "drop-shadow-xl dark:drop-shadow-[0_8px_32px_rgba(0,0,0,0.45)]", imgClassName ?? ""].join(" ")}
        onError={() => setBroken(true)}
      />
    </motion.div>
  );
}
