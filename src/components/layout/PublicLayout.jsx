import { useEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Navbar } from "../Navbar";
import { ColorMesh } from "../ColorMesh";
import { useLenis } from "../../hooks/useLenis";
import { bindScrollReveals } from "../../animations/scrollAnimations";

export function PublicLayout() {
  const location = useLocation();
  const root = useRef(null);
  const isLanding = location.pathname === "/";
  useLenis(isLanding);

  useEffect(() => {
    if (!root.current || !isLanding) return;
    return bindScrollReveals(root.current);
  }, [isLanding, location.pathname]);

  return (
    <div ref={root} className="relative min-h-svh overflow-x-hidden text-ink">
      <ColorMesh />
      <Navbar />
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>
    </div>
  );
}

