import Notices from '@/src/app/components/Notices';
import CreateNoticeBtn from "@/src/app/components/CreateNoticeBtn";
import { getCurrentUser } from "@/src/app/lib/session";
import Link from "next/link";

const NoticePage = async () => {

    const currentUser = await getCurrentUser();

    return (
        <>
            <div className="content-wrap flex-col gap-4">
                <div className="product-fragrance-header-layout">
                    <div className="flex flex-row justify-between items-center">
                        <h2 className="text-gradient-scent page-title-gradient">Notice</h2>
                        {currentUser?.email && <CreateNoticeBtn />}
                    </div>
                </div>
                {/* 서비스 소개 배너 */}
                <Link
                    href="/notice/intro"
                    className="flex items-center justify-between gap-3 rounded-xl border border-default px-4 py-3 text-sm hover:opacity-80 transition-opacity"
                    style={{
                        background:
                            'linear-gradient(115deg, rgba(166,125,92,0.07) 0%, rgba(92,74,122,0.1) 55%, rgba(176,125,130,0.07) 100%)',
                    }}
                >
                    <div className="flex items-center gap-2">
                        <span className="text-base">🌸</span>
                        <span>
                            <span className="font-semibold">Scent Memories 소개 및 이용 안내</span>
                            <span className="ml-2 text-secondary hidden sm:inline">
                                — 처음 방문하셨나요? 서비스 소개와 이용 방법을 확인해 보세요.
                            </span>
                        </span>
                    </div>
                    <span className="text-secondary shrink-0">→</span>
                </Link>
                <Notices />
            </div>
        </>
    );
}

export default NoticePage;