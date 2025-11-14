import Link from 'next/link'
import React from 'react'

const Footer = () => {
    return (
        <footer className='bg-black text-white mt-16 pt-16'>
            <div className='w-[80%] mx-auto flex md:justify-between flex-col md:items-end md:flex-row gap-10'>
                <div className=''>
                    <h2 className='text-lg md:text-xl lg:text-2xl font-bold text-white'>Contact Us</h2>
                    <h3 className='mt-2'>Have recommendations?</h3>
                    <p>
                        Contact us at {" "}
                        <Link href="mailto:k230691@nu.edu.pk" className='hover:text-white/80 duration-200 underline'>k230691@nu.edu.pk</Link>
                    </p>
                </div>
                <div className='text-light text-sm'>
                    © 2025 FORKED NUCES. All rights reserved.
                </div>
            </div>

            <div className="flex flex-col py-16">
                <h1 className="font-jaro bold text-6xl min-[400px]:text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] text-white text-center">FORK'D NUCES</h1>
                <h3 className="text-lg min-[400px]:text-xl sm:text-2xl text-white text-center">FASTians Build Better Together.</h3>
            </div>
        </footer>
    )
}

export default Footer