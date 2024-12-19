import Image from "next/image";
import { Navbar } from "./components/Navbar";
export default function Home() {
  return (
    <div className="text-white   bg-black items-center justify-items-center w-screen h-[200vh] p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <Navbar />
    </div>
  );
}
