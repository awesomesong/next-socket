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
import { useRef, use } from "react";

interface IParams {
    conversationId: string;
}

const Conversation = ({ params }: { params : Promise<IParams> }) => {   
    const { data: session } = useSession();
    const { conversationId } = use(params);
    const scrollRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    const { 
        data, 
        status,
        refetch,
        error
    } = useQuery({
        queryKey: ['conversation', conversationId],
        queryFn: () => getConversationById(conversationId),
        enabled: !!conversationId,
    });

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
                            scrollRef={scrollRef} 
                            bottomRef={bottomRef} 
                            conversationId={conversationId}
                            aiAgentType={data?.conversation?.aiAgentType}
                        />
                    ) : isForm ? (
                        <Form scrollRef={scrollRef} bottomRef={bottomRef} />
                    ) : (
                        <UnavailableChatForm />
                    )}
                </div>
            )}
        </div>
    )
}

export default Conversation;
