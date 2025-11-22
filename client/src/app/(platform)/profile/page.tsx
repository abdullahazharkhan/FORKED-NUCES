import React from 'react'
import UserDetails from './components/UserDetails'
import UserOperations from './components/UserOperations'

const Profile = () => {
    return (
        <div className='mt-6 flex flex-col gap-6'>
            <UserDetails />
            <div className="border-t-2 border-primarypurple/20"></div>
            <UserOperations />
        </div>
    )
}

export default Profile