import "./globals.css";

export const metadata = {
  title: "FocusTunes Prototype",
  description: "Prototype FocusTunes dengan rekomendasi adaptif, smart queue, dan live focus session.",
};

export const viewport = {
  themeColor: "#082B5C",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
