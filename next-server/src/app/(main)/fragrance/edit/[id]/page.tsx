"use client";

import FormFragrance from "@/src/app/components/FormFragrance";
import { FragranceFormSkeleton } from "@/src/app/components/FragranceSkeleton";
import { getFragrance } from "@/src/app/lib/getFragrance";
import { fragranceDetailKey } from "@/src/app/lib/react-query/fragranceCache";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { use } from "react";

type IdProps = { id: string };
type ParamsProps = { params: Promise<IdProps> };

const FragranceEditPage = ({ params }: ParamsProps) => {
    const { id } = use(params);
    const { data: session } = useSession();

    const { data, status } = useQuery({
        queryKey: fragranceDetailKey(id),
        queryFn: () => getFragrance(id),
        enabled: !!id && !!session?.user?.email,
    });

    if (status === "pending") {
        return (
            <div className="p-4 md:p-8 max-w-[1440px] mx-auto min-h-screen">
                <h2 className="w-full text-center text-2xl font-light tracking-widest mb-8">
                    <span className="text-gradient-scent">향수 정보 수정</span>
                </h2>
                <FragranceFormSkeleton />
            </div>
        );
    }

    if (status === "success" && data?.fragrance) {
        return (
            <div className="p-4 md:p-8 max-w-[1440px] mx-auto min-h-screen">
                <h2 className="w-full text-center text-2xl font-light tracking-widest mb-8">
                    <span className="text-gradient-scent">향수 정보 수정</span>
                </h2>
                <FormFragrance id={id} initialData={data.fragrance} isEdit />
            </div>
        );
    }

    return (
        <div className="flex justify-center items-center min-h-screen text-stone-500 dark:text-stone-400">
            향수를 찾을 수 없습니다.
        </div>
    );
};

export default FragranceEditPage;
