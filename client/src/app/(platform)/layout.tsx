import React from 'react'
import Footer from './components/Footer'

const Layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="flex flex-col min-h-screen">
            <main className="flex-grow">
                {children}
            </main>
            <Footer />
        </div>
    )
}

export default Layout