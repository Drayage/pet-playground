import "../src/styles.css";

export const metadata = {
  title: "우리 집 동물놀이터",
  description: "모바일과 데스크톱에서 즐기는 Pet Playground 카드 게임",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
