import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export function Modal({ open, onClose, children, labelledBy, showCloseButton = true, maxWidth = "max-w-xl" }) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e) {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4 md:p-6 backdrop-blur-sm overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            initial={{ y: 24, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className={`relative max-h-[92vh] w-full ${maxWidth} flex flex-col rounded-3xl border-3 border-web/20 bg-white p-5 sm:p-6 text-ink shadow-2xl overflow-y-auto`}
            onClick={(event) => event.stopPropagation()}
          >
            {showCloseButton && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 rounded-full border-2 border-slate-300 bg-white p-1.5 text-slate-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition shadow-xs z-10"
                title="Close (Esc)"
              >
                <X size={18} />
              </button>
            )}
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

