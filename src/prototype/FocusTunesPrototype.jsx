"use client";

import { AppShell } from "./components/layout/index.js";
import { PrototypeProvider } from "./context/PrototypeProvider.jsx";
import { PrototypeRouter } from "./PrototypeRouter.jsx";
import { DEFAULT_SCREEN } from "./routes.js";

export default function FocusTunesPrototype({ initialScreen = DEFAULT_SCREEN }) {
  return (
    <PrototypeProvider initialScreen={initialScreen}>
      <AppShell>
        <PrototypeRouter />
      </AppShell>
    </PrototypeProvider>
  );
}
