import { Navbar } from "../components/layout/Navbar";
import { SwapInterface } from "../components/SwapInterface";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#0D111C] text-slate-900 dark:text-white flex flex-col transition-colors duration-500 relative overflow-hidden">
      {/* High-Contrast Glow positioned behind SwapInterface */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#FB118E]/20 to-[#8A2BE2]/20 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <SwapInterface />
        </div>
      </div>
    </main>
  );
}
