'use client';
import EmptyState from "@/components/EmptyState";
import getConversationById from "@/src/app/lib/getConversationById";
import UnavailableChatForm from "@/components/UnavailableChatForm";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Header from "@/components/chat/Header";
import Body from "@/components/chat/Body";
import Form from "@/components/chat/Form";

interface IParams {
    conversationId: string;
}

const Conversation = ({ params }: { params : IParams }) => {    
    const { data: session } = useSession();
    const conversationId = params.conversationId;

    const { 
        data, 
        status,
    } = useQuery({
        queryKey: ['conversation', conversationId],
        queryFn: () => getConversationById(conversationId),
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
        <div className="grow h-full relative">
            <div className="flex flex-col h-full">
            {status === 'success' 
                ? (<>
                    <Header conversation={data?.conversation} currentUser={session?.user}/>
                    <Body />
                    {isForm ? <Form /> : <UnavailableChatForm />}
                </>)
                : (<div className="flex justify-center items-center h-full">
                    <progress className="pure-material-progress-circular"/>
                </div>)
            }
            </div>
        </div>
    )
}

export default Conversation;
