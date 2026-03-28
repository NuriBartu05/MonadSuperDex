import { Navbar } from "../components/layout/Navbar";
import { SwapInterface } from "../components/SwapInterface";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0D111C] text-white flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <SwapInterface />
      </div>
    </main>
  );
}
