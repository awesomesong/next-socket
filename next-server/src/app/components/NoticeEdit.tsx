'use client';
import Link from 'next/link';
import { NoticeIdProps } from '@/src/app/types/notice';

const NoticeEdit = ({ noticeId }: NoticeIdProps) => {
    return (
        <Link
            href={`/notice/${noticeId}/edit`}
            className="action-btn"
        >
            수정
        </Link>
    );
};

export default NoticeEdit;
