"use client";
import React, { useContext } from 'react'

const UserOperations = () => {
    const operations = ["Your Projects", "Edit Profile", "Add Project"];
    const [selectedOperation, setSelectedOperation] = React.useState<string>(operations[0]);

    return (
        <div>
            <div className='flex'>
                {operations.map((operation, index) => (
                    <div key={index} className={`p-2 text-lg font-medium
                        hover:text-black duration-300
                        ${selectedOperation === operation ? "border-b-4 text-black" : "text-gray-600"}
                        cursor-pointer`}
                        onClick={() => setSelectedOperation(operation)}>{operation}</div>
                ))}
            </div>
        </div>
    )
}

export default UserOperations