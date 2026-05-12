"use client";

import { AppShell } from "../../src/prototype/components/layout/index.js";
import { PrototypeProvider } from "../../src/prototype/context/PrototypeProvider.jsx";

export default function PrototypeLayout({ children }) {
  return (
    <PrototypeProvider>
      <AppShell>{children}</AppShell>
    </PrototypeProvider>
  );
}
