import React from 'react'
import { MdManageAccounts, MdContentPasteSearch } from "react-icons/md";
import { FaThList } from "react-icons/fa";

const FeatureBox = ({
    title,
    description,
    Icon,
}: {
    title: string;
    description: string;
    Icon: React.ElementType;
}) => {
    return (
        <div className="relative bg-white rounded-xl shadow-md px-6 py-8 border-l-4 border-b-4 hover:shadow-lg space-y-4 cursor-default">
            <div className="absolute -top-6 right-0 -translate-x-1/2">
                <div className="bg-primarygreen text-black w-16 h-16 rounded-full flex items-center justify-center shadow-md">
                    <Icon className="text-2xl" />
                </div>
            </div>

            <h3 className="text-xl font-semibold">
                {title}
            </h3>

            <p className="text-gray-700 text-sm text-center">
                {description}
            </p>
        </div>
    );
};


const Features = () => {
    const features = [
        {
            title: "Profile Management",
            description: "Update your personal info, skills, and project details so contributors instantly know your strengths. Build a clean public profile that highlights what you love to work on and what you're great at.",
            icon: MdManageAccounts
        },
        {
            title: "Project Listing",
            description: "Add your GitHub repositories to the platform and showcase what you're building to the FAST community. Highlight issues, features, and ideas so others can easily jump in and contribute.",
            icon: FaThList
        },
        {
            title: "Project Search",
            description: "Search through all listed projects and quickly find ideas that match your skills and interests. Filter by tags, technologies, and difficulty to discover the perfect project to contribute to.",
            icon: MdContentPasteSearch
        },
    ];
    return (
        <div className='space-y-12'>
            <h1 className='text-6xl font-black italic tracking-[-0.20rem] uppercase text-center underline underline-offset-2 decoration-primarygreen bg-primarygreen/20 w-fit mx-auto'>
                Features
            </h1>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-4 w-7/8 mx-auto'>
                {features.map((feature, index) => (
                    <FeatureBox key={index} title={feature.title} description={feature.description} Icon={feature.icon} />
                ))}
            </div>
        </div>
    )
}

export default Features