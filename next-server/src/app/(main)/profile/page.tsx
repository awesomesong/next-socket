import AvatarProfile from "@/src/app/components/AvatarProfile";
import { getCurrentUser } from "@/src/app/lib/session";

// 사용자별 세션 데이터를 매 요청마다 조회해야 하므로 SSR로 고정
export const dynamic = 'force-dynamic';

const Profile = async () => {
    const user = await getCurrentUser();

    if( user ){
        return (
            <div className="flex flex-col items-center py-16 max-md:py-12 px-4">
                <AvatarProfile user={user} />
                <div className="mt-2 pt-6 w-full max-w-sm flex flex-col items-center gap-1 text-center">
                    <p className="text-lg font-semibold text-[var(--color-text-primary)] tracking-tight">
                        {user.name}
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)] break-all">
                        {user.email}
                    </p>
                </div>
            </div>
        )
    }
}

export default Profile;
