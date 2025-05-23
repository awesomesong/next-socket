'use client';
import EmptyState from "@/src/app/components/EmptyState";
import getConversationById from "@/src/app/lib/getConversationById";
import UnavailableChatForm from "@/src/app/components/UnavailableChatForm";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Header from "@/src/app/components/chat/Header";
import Body from "@/src/app/components/chat/Body";
import Form from "@/src/app/components/chat/Form";
import { useRef } from "react";
import toast from "react-hot-toast";


interface IParams {
    conversationId: string;
}

const Conversation = ({ params }: { params : IParams }) => {   
    const { data: session } = useSession();
    const conversationId = params.conversationId;
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

    if(!!data?.message) {
        return (
            <div className="grow h-full">
                <div className="flex flex-col w-full h-full">
                    <EmptyState message={data?.message} />
                </div>
            </div>
        )
    }
    
    const isForm = data?.conversation?.userIds.length > 1;

    return (
        <div className="flex flex-col w-full">
            {status === 'success' 
                ? (<div className="flex flex-col flex-1 overflow-hidden relative">
                    <Header conversation={data?.conversation} currentUser={session?.user}/>
                    <Body scrollRef={scrollRef} bottomRef={bottomRef} />
                    {isForm ? <Form scrollRef={scrollRef} bottomRef={bottomRef}  /> : <UnavailableChatForm />}
                </div>)
                : (<div className="flex-1 flex justify-center items-center">
                    <progress className="pure-material-progress-circular"/>
                </div>)
            }
        </div>
    )
}

export default Conversation;
