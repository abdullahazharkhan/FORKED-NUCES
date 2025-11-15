import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Enter To FORKED NUCES",
    description: "",
};

export default function AuthLayout({
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
