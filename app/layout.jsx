import "./globals.css";

export const metadata = {
  title: "Red Petroleum EDO",
  description: "MVP электронного документооборота входящей и исходящей корреспонденции"
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
