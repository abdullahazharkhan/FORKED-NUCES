"use client";

import { create } from "zustand";

export interface UserType {
    user_id: number;
    full_name: string;
    nu_email: string;
    github_username: string | null;
    is_github_connected: boolean;
    avatar_url: string | null;
    bio: string | null;
    is_email_verified: boolean;
    skills: string[] | null;
    created_at: string;
    updated_at: string;
}

export type SessionStatus = "idle" | "loading" | "authenticated" | "unauthenticated" | "error";

interface AuthState {
    user: UserType | null;
    sessionStatus: SessionStatus;

    setUser: (userData: UserType) => void;
    updateUser: (partial: Partial<UserType>) => void;
    clearUser: () => void;
    setSessionStatus: (status: SessionStatus) => void;
    getUser: () => UserType | null;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
    user: null,
    sessionStatus: "idle",

    setUser: (userData) => set({ user: userData, sessionStatus: "authenticated" }),

    updateUser: (partial) =>
        set((state) =>
            state.user
                ? { user: { ...state.user, ...partial } }
                : state
        ),

    clearUser: () => set({ user: null, sessionStatus: "unauthenticated" }),
    setSessionStatus: (sessionStatus) => set({ sessionStatus }),
    getUser: () => get().user,
}));
