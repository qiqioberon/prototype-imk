"use client";

import { AnimatePresence, motion } from "framer-motion";

import { screens } from "./screens/index.js";

export function PrototypeRoutePage({ screen }) {
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
