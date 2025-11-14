import React from 'react'

const UseCaseBox = ({ title, description }: { title: string; description: string; }) => {
    return (
        <div className='bg-white rounded-xl p-4 border-l-4 border-b-4 cursor-default hover:shadow-lg space-y-2'>
            <h2 className='text-xl font-semibold'>{title}</h2>
            <p className='text-gray-700 text-sm'>{description}</p>
        </div>
    );
}

const UseCases = () => {
    const useCases = [
        {
            title: "Help Students Finish Their Projects",
            description: "Students struggling with complex features can list their issues and get help from those who already know the solution.",
        },
        {
            title: "Discover Projects You Care About",
            description: "Browse community projects and join the ones that match your skills, tech stack, or curiosity.",
        },
        {
            title: "Practice Open-Source Contribution",
            description: "Gain real-world experience by contributing to live student projects, just like GitHub open-source workflows.",
        },
        {
            title: "Build Your Developer Portfolio",
            description: "Every issue you solve and project you join becomes part of your public profile — perfect for internships and CVs.",
        },
        {
            title: "Collaborate Across Batches",
            description: "Work together with students from different semesters and campuses through shared issues and repositories.",
        },
        {
            title: "Team Building for Competitions",
            description: "Find partners who work like you do — ideal for hackathons, semester projects, or CP/AI competitions.",
        },
    ];
    return (
        <div className='space-y-12'>
            <h1 className='text-6xl font-black italic tracking-[-0.20rem] uppercase text-center underline underline-offset-2 decoration-primarygreen bg-primarygreen/20 w-fit mx-auto'>Use Cases</h1>
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-7/8 mx-auto'>
                {useCases.map((useCase, index) => (
                    <UseCaseBox key={index} title={useCase.title} description={useCase.description} />
                ))}
            </div>
        </div>
    )
}

export default UseCases