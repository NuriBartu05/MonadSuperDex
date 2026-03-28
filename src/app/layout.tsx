import "./globals.css"; // MUST BE AT THE ABSOLUTE TOP OF THE IMPORT TREE
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "../components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Monad Batch Swap MVP",
  description: "Secure, highly optimized, standard Router batch swapping on Monad Mainnet natively bypassing Permit2 constraints.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-950 text-white min-h-screen selection:bg-indigo-500 selection:text-white`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
