import Link from 'next/link'

const Footer = () => {
    return (
        <footer className='bg-black text-white mt-16 pt-16'>
            <div className='w-[80%] mx-auto flex md:justify-between flex-col md:items-end md:flex-row gap-10'>
                <div className=''>
                    <h2 className='text-lg md:text-xl lg:text-2xl font-bold text-white'>Contact Us</h2>
                    <p className='mt-2'>Have recommendations?</p>
                    <div className='mt-1 flex flex-col gap-1 text-sm text-white/80'>
                        <span>Abdullah Azhar Khan — <Link href="mailto:k230691@nu.edu.pk" className='hover:text-white duration-200 underline'>k230691@nu.edu.pk</Link></span>
                        <span>Abdul Rafay Mughal — <Link href="mailto:k230667@nu.edu.pk" className='hover:text-white duration-200 underline'>k230667@nu.edu.pk</Link></span>
                        <span>Muhammad Awais — <Link href="mailto:k230544@nu.edu.pk" className='hover:text-white duration-200 underline'>k230544@nu.edu.pk</Link></span>
                    </div>
                </div>
                <div className='text-light text-sm'>
                    <nav aria-label="Legal" className="mb-3 flex flex-wrap gap-x-4 gap-y-2">
                        <Link href="/privacy" className="underline hover:text-white">Privacy</Link>
                        <Link href="/terms" className="underline hover:text-white">Terms</Link>
                        <Link href="/community-guidelines" className="underline hover:text-white">Guidelines</Link>
                    </nav>
                    © 2026 FORKED NUCES. All rights reserved.
                </div>
            </div>

            <div className="flex flex-col py-16">
                <p className="font-jaro bold text-6xl min-[400px]:text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] text-white text-center">FORK'D NUCES</p>
                <p className="text-lg min-[400px]:text-xl sm:text-2xl text-white text-center">FASTians Build Better Together.</p>
            </div>
        </footer>
    )
}

export default Footer
