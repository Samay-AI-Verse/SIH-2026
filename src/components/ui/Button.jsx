import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

export function Button({
  children,
  className,
  variant = "primary",
  type = "button",
  disabled,
  onClick,
  href,
  to,
  target,
  rel,
  download,
}) {
  const styles = {
    primary:
      "bg-spidey text-white font-bold uppercase tracking-wide shadow-[6px_6px_0_#071433] hover:bg-[#c31322]",
    secondary: "bg-gold text-ink font-bold uppercase tracking-wide shadow-[6px_6px_0_#e11d2e] hover:brightness-105",
    ghost: "text-white hover:text-gold",
    danger: "bg-spidey text-white hover:bg-[#c31322]",
  }[variant];

  const classNames = cn(
    "shine inline-flex items-center justify-center gap-2 rounded-sm px-5 py-2.5 font-ui text-sm font-bold uppercase tracking-[0.16em] transition disabled:cursor-not-allowed disabled:opacity-50",
    styles,
    className
  );

  if (href) {
    return (
      <motion.a
        href={href}
        target={target}
        rel={rel}
        download={download}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.96 }}
        className={classNames}
      >
        {children}
      </motion.a>
    );
  }

  if (to) {
    return (
      <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }} className="inline-flex">
        <Link to={to} className={classNames}>
          {children}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.96 }}
      className={classNames}
    >
      {children}
    </motion.button>
  );
}
