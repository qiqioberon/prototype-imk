import "./globals.css";

export const metadata = {
  title: "FocusTunes Prototype",
  description: "Prototype aplikasi fokus berbasis musik untuk tugas IMK.",
};

export const viewport = {
  themeColor: "#082B5C",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
