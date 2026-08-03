import Image from "next/image";

import { passthroughImageLoader } from "@/lib/passthroughImageLoader";

const avatarSizes = {
    lg: { className: "h-16 w-16 text-2xl", pixels: 64 },
    md: { className: "h-12 w-12 text-lg", pixels: 48 },
    sm: { className: "h-10 w-10 text-sm", pixels: 40 },
} as const;

type UserAvatarProps = {
    avatarUrl: string | null;
    name: string;
    size?: keyof typeof avatarSizes;
};

export function UserAvatar({
    avatarUrl,
    name,
    size = "md",
}: UserAvatarProps) {
    const config = avatarSizes[size];

    if (avatarUrl) {
        return (
            <Image
                loader={passthroughImageLoader}
                unoptimized
                src={avatarUrl}
                alt={`${name || "User"} avatar`}
                width={config.pixels}
                height={config.pixels}
                className={`${config.className} shrink-0 rounded-2xl border border-primarypurple/15 object-cover shadow-[0_8px_20px_rgba(54,29,117,0.11)]`}
            />
        );
    }

    return (
        <span
            className={`${config.className} flex shrink-0 items-center justify-center rounded-2xl border border-primarypurple/10 bg-[linear-gradient(145deg,rgba(111,60,255,0.14),rgba(111,60,255,0.06))] font-mono font-bold text-primarypurple shadow-[0_8px_20px_rgba(54,29,117,0.08)]`}
            aria-hidden="true"
        >
            {(name || "U").charAt(0).toUpperCase()}
        </span>
    );
}
