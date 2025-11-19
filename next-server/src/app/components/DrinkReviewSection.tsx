'use client';
import { useSession } from 'next-auth/react';
import FormReview from '@/src/app/components/FormReview';
import Reviews from '@/src/app/components/Reviews';

type DrinkReviewSectionProps = {
  drinkName: string;
  drinkSlug: string;
};

export default function DrinkReviewSection({ drinkName, drinkSlug }: DrinkReviewSectionProps) {
  const { data: session } = useSession();

  return (
    <div className='md:px-6 md:py-3 px-3'>
      {session?.user && <FormReview id={drinkSlug} user={session.user} />}
      <Reviews id={drinkSlug} name={drinkName} user={session?.user} />
    </div>
  );
}

