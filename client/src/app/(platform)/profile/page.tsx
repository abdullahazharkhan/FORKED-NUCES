import UserDetails from "./components/UserDetails";
import UserOperations from "./components/UserOperations";

const Profile = () => {
    return (
        <div className="flex flex-col gap-9">
            <UserDetails page="profile" />
            <UserOperations />
        </div>
    );
};

export default Profile;
