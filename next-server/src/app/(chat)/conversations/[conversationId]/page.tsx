'use client';
import EmptyState from "@/src/app/components/EmptyState";
import getConversationById from "@/src/app/lib/getConversationById";
import UnavailableChatForm from "@/src/app/components/UnavailableChatForm";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Header from "@/src/app/components/chat/Header";
import Body from "@/src/app/components/chat/Body";
import Form from "@/src/app/components/chat/Form";
import useWindowHeight from "@/src/app/hooks/useWindowHeight";
import { useViewportHeight } from "@/src/app/hooks/useViewportHeight";

interface IParams {
    conversationId: string;
}

const Conversation = ({ params }: { params : IParams }) => {    
    const { data: session } = useSession();
    const conversationId = params.conversationId;
    const windowHeight = useWindowHeight(); // 👈 요거로 바꿈

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
    useViewportHeight();

    return (
        <div className="page-container relative w-full">
            {status === 'success' 
                ? (<>
                    <div className="flex flex-col w-full overflow-y-auto pb-[60px] h-full">
                        <Header conversation={data?.conversation} currentUser={session?.user}/>
                        <Body />
                    </div>
                    <div className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-gray-200">
                        {isForm ? <Form /> : <UnavailableChatForm />}
                    </div>
                </>)
                : (<div className="flex-1 flex justify-center items-center">
                    <progress className="pure-material-progress-circular"/>
                </div>)
            }
        </div>
    )
}

export default Conversation;
