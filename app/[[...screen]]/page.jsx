import { notFound } from "next/navigation";

import FocusTunesPrototype from "../../src/prototype/FocusTunesPrototype.jsx";
import { getScreenFromSegments } from "../../src/prototype/routes.js";

export default async function PrototypePage({ params }) {
  const resolvedParams = await params;
  const screen = getScreenFromSegments(resolvedParams?.screen);

  if (!screen) {
    notFound();
  }

  return <FocusTunesPrototype initialScreen={screen} />;
}
