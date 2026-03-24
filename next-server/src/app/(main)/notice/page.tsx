import Notices from '@/src/app/components/Notices';
import CreateNoticeBtn from "@/src/app/components/CreateNoticeBtn";
import { getCurrentUser } from "@/src/app/lib/session";

const NoticePage = async () => {

    const currentUser = await getCurrentUser();

    return (
        <>
            <div className="content-wrap flex-col gap-4 max-w-[1440px] mx-auto w-full">
                <div className="product-fragrance-header-layout">
                    <div className="flex flex-row justify-between items-center">
                        <h2 className="text-gradient-scent page-title-gradient">Notice</h2>
                        {currentUser?.email && <CreateNoticeBtn />}
                    </div>
                </div>
                <Notices />
            </div>
        </>
    );
}

export default NoticePage;