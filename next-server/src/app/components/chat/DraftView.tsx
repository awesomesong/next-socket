'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HiChevronLeft, HiUserGroup } from 'react-icons/hi2';
import Avatar from '@/src/app/components/Avatar';
import DraftForm from '@/src/app/components/chat/DraftForm';
import EmptyState from '@/src/app/components/EmptyState';
import { IUserList } from '@/src/app/types/common';

interface DraftViewProps {
    userId?: string | null;
    isGroup?: boolean;
    memberIds?: string[];
    groupName?: string;
    aiAgentType?: string;
}

const DraftView: React.FC<DraftViewProps> = ({
    userId,
    isGroup,
    memberIds = [],
    groupName = '',
    aiAgentType,
}) => {
    const isAI = !!aiAgentType;
    const [targetUser, setTargetUser] = useState<IUserList | null>(null);
    const [isLoading, setIsLoading] = useState(!isAI && !isGroup && !!userId);

    useEffect(() => {
        let cancelled = false;
        if (isAI || isGroup || !userId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        fetch(`/api/chatMember?userId=${encodeURIComponent(userId)}`)
            .then(async (r) => {
                if (!r.ok) return { user: null };
                return r.json();
            })
            .then((data) => {
                if (cancelled) return;
                setTargetUser(data?.user ?? null);
            })
            .catch(() => {
                if (cancelled) return;
                setTargetUser(null);
            })
            .finally(() => {
                if (cancelled) return;
                setIsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [userId, isGroup, isAI]);

    if (isLoading) {
        return (
            <div className="grow h-full flex items-center justify-center">
                <progress className="pure-material-progress-circular" />
            </div>
        );
    }

    if (!isAI && !isGroup && userId && targetUser === null && !isLoading) {
        return (
            <div className="grow h-full">
                <EmptyState message="해당 회원을 찾을 수 없습니다." isError />
            </div>
        );
    }

    const headerTitle = isAI
        ? '향수 AI 어시스턴트'
        : isGroup
            ? (groupName || '그룹 채팅')
            : (targetUser?.name ?? '');

    const headerSubtitle = isGroup ? `${memberIds.length + 1}명` : undefined;

    return (
        <div className="flex flex-col flex-1 overflow-hidden relative">
            {/* 헤더 */}
            <div className="flex justify-between items-center gap-2 w-full h-16 px-2 sm:px-4 header-border-b">
                <div className="flex gap-3 items-center">
                    <Link
                        href="/conversations"
                        className="lg:hidden block transition cursor-pointer hover:opacity-70"
                    >
                        <HiChevronLeft size={32} fill="url(#scent-nav-gradient)" />
                    </Link>
                    <div className="shrink">
                        {isAI ? (
                            <Avatar
                                user={targetUser ?? { image: 'None', id: null, email: null, name: null }}
                                isAIChat
                            />
                        ) : isGroup ? (
                            <div className="w-10 h-10 rounded-full bg-gradient-scent-avatar flex items-center justify-center">
                                <HiUserGroup size={20} className="text-white" />
                            </div>
                        ) : (
                            <Avatar user={targetUser ?? { image: 'None', id: null, email: null, name: null }} />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <div className="line-clamp-1 tracking-tight font-medium text-[var(--color-text-primary)]">
                            {headerTitle}
                        </div>
                        {headerSubtitle && (
                            <div className="chat-item__status">{headerSubtitle}</div>
                        )}
                    </div>
                </div>
            </div>

            {/* 빈 채팅 영역 */}
            <div className="flex-1 flex items-center justify-center text-sm text-[var(--color-text-secondary)]">

            </div>

            {/* 드래프트 폼 */}
            <DraftForm
                targetUserId={userId ?? undefined}
                isGroup={isGroup}
                memberIds={memberIds}
                groupName={groupName}
                aiAgentType={aiAgentType}
            />
        </div>
    );
};

export default DraftView;
