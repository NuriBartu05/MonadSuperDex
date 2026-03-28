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
        <html lang="en" suppressHydrationWarning>
            <body className="bg-slate-50 dark:bg-[#0D111C] text-slate-900 dark:text-white transition-colors duration-500">
                {/* Tüm Web3 mimarisini uygulamaya sarıyoruz */}
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}