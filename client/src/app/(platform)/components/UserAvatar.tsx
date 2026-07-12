import Image from "next/image";

import { passthroughImageLoader } from "@/lib/passthroughImageLoader";

const avatarSizes = {
    lg: { className: "h-16 w-16 text-2xl", pixels: 64 },
    md: { className: "h-12 w-12 text-lg", pixels: 48 },
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
                className={`${config.className} shrink-0 rounded-full border border-primarypurple/20 object-cover`}
            />
        );
    }

    return (
        <span
            className={`${config.className} flex shrink-0 items-center justify-center rounded-full bg-primarypurple/15 font-bold text-primarypurple`}
            aria-hidden="true"
        >
            {(name || "U").charAt(0).toUpperCase()}
        </span>
    );
}
