import React from 'react'

const About = () => {
  return (
    <div className='space-y-8'>
      <h1 className='text-6xl font-black italic tracking-[-0.20rem] uppercase text-center underline underline-offset-2 decoration-primarygreen bg-primarygreen/20 w-fit mx-auto'>
        About
      </h1>
      <p className='text-gray-700 text-md w-2/3 mx-auto space-y-4 text-center'>
        <span className='text-primarypurple text-xl font-bold'>
          FORKED NUCES {" "}
        </span>
        is a student-driven collaboration platform designed for FASTians who love building projects — but sometimes get stuck on tough features. Many great ideas never reach completion because students lack experience in certain parts of development.
        <br />
        <span className='text-lg font-bold'>
          This platform solves that.
        </span>
      </p>
    </div>
  )
}

export default About