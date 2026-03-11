'use client';
import EmptyState from "@/src/app/components/EmptyState";
import getConversationById from "@/src/app/lib/getConversationById";
import UnavailableChatForm from "@/src/app/components/UnavailableChatForm";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Header from "@/src/app/components/chat/Header";
import Body from "@/src/app/components/chat/Body";
import Form from "@/src/app/components/chat/Form";
import AIChatForm from "@/src/app/components/chat/AIChatForm";
import DraftView from "@/src/app/components/chat/DraftView";
import { useRef, use } from "react";
import { useSearchParams } from "next/navigation";
import { conversationKey } from "@/src/app/lib/react-query/chatCache";

interface IParams {
    conversationId: string;
}

const Conversation = ({ params }: { params : Promise<IParams> }) => {
    const { data: session } = useSession();
    const { conversationId } = use(params);
    const searchParams = useSearchParams();
    const scrollRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    const isDraft = conversationId === "new";

    const {
        data,
        status,
    } = useQuery({
        queryKey: conversationKey(conversationId),
        queryFn: () => getConversationById(conversationId),
        enabled: !isDraft && !!conversationId,
        gcTime: 5 * 60_000,
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: true,
        retry: 1,
        retryOnMount: true,
    });

    if (isDraft) {
        const userId = searchParams.get('userId');
        const isGroup = searchParams.get('isGroup') === 'true';
        const membersParam = searchParams.get('members');
        const groupName = searchParams.get('name') ?? '';
        const memberIds = membersParam ? membersParam.split(',').filter(Boolean) : [];
        const aiAgentType = searchParams.get('aiAgentType') ?? undefined;

        return (
            <div className="flex flex-col w-full h-full">
                <DraftView
                    userId={userId}
                    isGroup={isGroup}
                    memberIds={memberIds}
                    groupName={groupName}
                    aiAgentType={aiAgentType}
                />
            </div>
        );
    }

    if(status === 'pending') {
        return (
            <div className="grow h-full flex items-center justify-center">
                <progress className="pure-material-progress-circular"/>
            </div>
        )
    }

    if(status === 'success' && !data?.conversation) {
        return (
            <div className="grow h-full">
                <div className="flex flex-col w-full h-full">
                    <EmptyState message={data?.message} isError />
                </div>
            </div>
        )
    }
    
    const isForm = data?.conversation?.userIds.length > 1;
    const isAIChat = data?.conversation?.isAIChat;

    return (
        <div className="flex flex-col w-full">
            {status === 'success' && (
                <div className="flex flex-col flex-1 overflow-hidden relative">
                    <Header conversation={data?.conversation} currentUser={session?.user}/>
                    <Body scrollRef={scrollRef} bottomRef={bottomRef} isAIChat={!!isAIChat} />
                    {isAIChat ? (
                        <AIChatForm
                            conversationId={conversationId}
                            aiAgentType={data?.conversation?.aiAgentType}
                        />
                    ) : isForm ? (
                        <Form />
                    ) : (
                        <UnavailableChatForm />
                    )}
                </div>
            )}
        </div>
    )
}

export default Conversation;
