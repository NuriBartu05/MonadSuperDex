import type { Metadata } from "next";
import { Providers } from "../components/Providers";
import "./globals.css"; // Stillerimizi burada çağırıyoruz

export const metadata: Metadata = {
    title: "Monad Batch Swap",
    description: "Advanced Multi-Token DEX Aggregator on Monad",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body>
                {/* Tüm Web3 mimarisini uygulamaya sarıyoruz */}
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}