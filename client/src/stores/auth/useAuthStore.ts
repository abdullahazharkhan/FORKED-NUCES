"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserType {
    user_id: number;
    full_name: string;
    nu_email: string;
    github_username: string | null;
    is_github_connected: boolean;
    avatar_url: string | null;
    bio: string | null;
    is_email_verified: boolean;
    created_at: string;
    updated_at: string;
}

interface AuthState {
    user: UserType | null;

    setUser: (userData: UserType) => void;
    clearUser: () => void;
    getUser: () => UserType | null;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,

            setUser: (userData) => set({ user: userData }),

            clearUser: () => set({ user: null }),

            getUser: () => get().user,
        }),
        {
            name: "auth-user-storage",  // stored in localStorage
        }
    )
);
