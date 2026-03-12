'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useQueryClient, InfiniteData } from '@tanstack/react-query';

import { deleteFragrance } from '@/src/app/lib/deleteFragrance';
import { fragranceDetailKey, fragranceListKey } from '@/src/app/lib/react-query/fragranceCache';
import type { FragranceWithAuthor } from '@/src/app/types/fragrance';

type Props = {
  fragranceId: string;
  slug: string;
  brand: string;
  name: string;
  authorEmail: string | null;
};

export default function FragranceActionBarClient({
  fragranceId,
  slug,
  brand,
  name,
  authorEmail,
}: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const hasEditPermission = useMemo(() => {
    if (!session?.user?.email || !authorEmail) return false;
    const isAuthor = session.user.email === authorEmail;
    const isAdmin = session.user.role === 'admin';
    return isAuthor || isAdmin;
  }, [session?.user?.email, session?.user?.role, authorEmail]);

  const handleDelete = async () => {
    const confirmed = confirm(`"${brand} ${name}" 향수를 삭제하겠습니까?`);
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteFragrance(fragranceId);

      // 목록 캐시에서 제거 (목록 화면이 RQ를 쓰는 경우 UX 개선)
      queryClient.setQueryData<InfiniteData<FragranceWithAuthor[]>>(fragranceListKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => (page ?? []).filter((f) => f.id !== fragranceId)),
        };
      });
      queryClient.removeQueries({ queryKey: fragranceDetailKey(slug), exact: true });

      toast.success('향수가 삭제되었습니다.');
      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '향수 삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="detail-action-bar">
      <Link href="/" className="action-btn">
        목록
      </Link>
      {hasEditPermission && (
        <>
          <Link href={`/fragrance/${slug}/edit`} className="action-btn">
            수정
          </Link>
          <button
            type="button"
            className="action-btn"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? '삭제 중' : '삭제'}
          </button>
        </>
      )}
    </div>
  );
}

