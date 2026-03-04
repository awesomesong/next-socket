'use client';
import { useSession } from 'next-auth/react';
import FormReview from '@/src/app/components/FormReview';
import Reviews from '@/src/app/components/Reviews';
import { ReviewFormSkeleton } from './FragranceSkeleton';

type FragranceReviewSectionProps = {
    fragranceName: string;
    fragranceSlug: string;
};

export default function FragranceReviewSection({ fragranceName, fragranceSlug }: FragranceReviewSectionProps) {
    const { data: session, status } = useSession();

    return (
        <>
            {status === 'loading' ? (
                <ReviewFormSkeleton />
            ) : (
                session?.user && <FormReview id={fragranceSlug} user={session.user} />
            )}
            <Reviews id={fragranceSlug} name={fragranceName} user={session?.user} />
        </>
    );
}
