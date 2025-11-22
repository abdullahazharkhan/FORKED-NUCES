import { ChevronLeftIcon } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

const ProfileLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className='p-6'>
            <Link
                href="/platform"
                className="w-fit text-lg md:text-xl lg:text-2xl font-bold text-white bg-black hover:bg-black/80 transition-all rounded-xl px-8 h-14 flex items-center justify-center"
            >
                <ChevronLeftIcon className="w-6 h-6" />
                Back
            </Link>
            {children}
        </div>
    )
}

export default ProfileLayout