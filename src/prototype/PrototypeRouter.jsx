"use client";

import { AnimatePresence, motion } from "framer-motion";

import { usePrototype } from "./context/PrototypeProvider.jsx";
import { screens } from "./screens/index.js";

export function PrototypeRouter() {
  const { screen } = usePrototype();
  const Screen = screens[screen] ?? screens.home;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={screen}
        className="h-full"
        initial={{ opacity: 0, x: 18 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -18 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        <Screen />
      </motion.div>
    </AnimatePresence>
  );
}
