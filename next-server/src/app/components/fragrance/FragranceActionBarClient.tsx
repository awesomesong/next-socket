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
import { withToastParams } from '../../lib/withToastParams';

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
      // 상세 캐시는 slug/id 둘 다 있을 수 있어 둘 다 제거
      queryClient.removeQueries({ queryKey: fragranceDetailKey(slug), exact: true });
      queryClient.removeQueries({ queryKey: fragranceDetailKey(fragranceId), exact: true });

      // 홈 목록은 refetchOnMount=false 이라, 삭제 후 빈 캐시가 남아있으면 재요청이 안 될 수 있음
      queryClient.invalidateQueries({ queryKey: fragranceListKey });

      router.push(withToastParams('/', 'success', '향수가 삭제되었습니다.'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '향수 삭제 중 오류가 발생했습니다.');
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

