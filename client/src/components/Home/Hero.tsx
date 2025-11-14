import React from 'react'

const Hero = () => {
  return (
      <div className="bg-primarypurple min-h-screen w-full flex items-center justify-center flex-col relative space-y-12">
          <div className="flex flex-col">
              <h1 className="font-jaro bold text-6xl min-[400px]:text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] text-white text-center">FORK'D NUCES</h1>
              <h3 className="text-lg min-[400px]:text-xl sm:text-2xl text-white text-center">FASTians Build Better Together.</h3>
          </div>
          <button className="bg-primarygreen text-black p-4 rounded-xl uppercase font-black text-2xl sm:text-4xl tracking-[-0.20rem] cursor-pointer italic pr-6">Start Contributing Now!</button>
      </div>
  )
}

export default Hero