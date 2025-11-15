import { Metadata } from "next";

export const metadata: Metadata = {
    title: "FORKED NUCES",
    description: "",
};

export default function PlatformLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            {children}
        </>
    );
}
