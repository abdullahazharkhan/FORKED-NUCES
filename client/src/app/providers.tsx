'use client'

import React from 'react'
import { HeroUIProvider } from '@heroui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionBootstrap } from './SessionBootstrap'

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = React.useState(() => new QueryClient())

    return (
        <QueryClientProvider client={queryClient}>
            <HeroUIProvider>
                <SessionBootstrap />
                {children}
            </HeroUIProvider>
        </QueryClientProvider>
    )
}
