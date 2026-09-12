import "./globals.css";

export const metadata = {
  title: "Side Quest — Find your crew",
  description: "SRM students finding groups for shared activities.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
