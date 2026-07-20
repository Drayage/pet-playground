import "../src/styles.css";

export const metadata = {
  title: "우리 집 동물놀이터",
  description: "모바일과 데스크톱에서 즐기는 Pet Playground 카드 게임",
  manifest: "/manifest.webmanifest",
  applicationName: "Pet Playground",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "동물놀이터",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2f6f49",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
