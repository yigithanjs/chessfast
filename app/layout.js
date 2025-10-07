import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: {
    default: "ChessFast",
    template: "%s | ChessFast",
  },
  description: "Learn chess quickly",
  keywords: ["chess", "training", "tactics", "lessons", "ChessFast"],
  openGraph: {
    title: "ChessFast",
    description: "Learn chess quickly",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ChessFast",
    description: "Learn chess quickly",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.className} ${spaceGrotesk.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
