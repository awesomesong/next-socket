import AvatarProfile from "@/components/AvatarProfile";
import { getCurrentUser } from "@/src/app/lib/session";

const Profile = async () => {
    const user = await getCurrentUser();

    if( user ){
        return (
            <div className="
                    flex
                    flex-col
                    justify-center
                    items-center
                    gap-4
                    py-20
                    max-md:py-10
                    rounded-sm
                "
            >
                <AvatarProfile user={user} />   
                <ul className="space-y-2">
                    <li>
                        <span className="tracking-[15px]">이</span>
                        <span>름</span>
                        <span className="tracking-[.5rem]">:</span>
                        <span>{user.name}</span>
                    </li>
                    <li>
                        <span>이메일</span>
                        <span className="tracking-[.5rem]">:</span>
                        <span>{user.email}</span>
                    </li>
                </ul>
            </div>
        )
    }
}

export default Profile;
