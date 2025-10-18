// import { Highlighter } from "@/components/ui/highlighter"

export default function Home() {
  return (
    <div className="bg-[#6F43FE] min-h-screen w-full flex items-center justify-center flex-col relative space-y-12">
      <div className="flex flex-col">
        <h1 className="font-jaro bold text-7xl sm:text-8xl md:text-9xl text-white text-center">FORKED NUCES</h1>
        <h3 className="text-xl sm:text-2xl text-white text-center">FASTians Build Better Together.</h3>
      </div>
      <button className="bg-primarygreen text-black p-0 uppercase font-[900] text-2xl sm:text-4xl tracking-tighter cursor-pointer italic pr-2">Start Contributing Now!</button>
    </div>
  );
}
