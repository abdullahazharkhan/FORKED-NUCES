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
        <div className="flex h-screen flex-col md:flex-row">
            <div className="md:w-1/2 bg-primarypurple flex justify-center items-center flex-col p-10">
                <div className="">
                    <h1 className="md:leading-5 md:pl-1 font-jaro bold text-4xl sm:text-6xl text-white">FORK'D</h1>
                    <h1 className="font-jaro bold text-6xl sm:text-7xl md:text-9xl lg:text-[10rem] text-white text-center">NUCES</h1>
                </div>
            </div>
            <div className="md:w-1/2 flex justify-center items-center p-10">
                {children}
            </div>
        </div>
    );
}
