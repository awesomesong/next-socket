'use client';
import EmptyState from "@/src/app/components/EmptyState";
import getConversationById from "@/src/app/lib/getConversationById";
import UnavailableChatForm from "@/src/app/components/UnavailableChatForm";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Header from "@/src/app/components/chat/Header";
import Body from "@/src/app/components/chat/Body";
import Form from "@/src/app/components/chat/Form";
import { useEffect, useState } from "react";

interface IParams {
    conversationId: string;
}

const Conversation = ({ params }: { params : IParams }) => {    
    const { data: session } = useSession();
    const conversationId = params.conversationId;
    const [keyboardOffset, setKeyboardOffset] = useState(0);

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
    
    useEffect(() => {
        const vv = window.visualViewport;
        if (!vv) return;

        const updateOffset = () => {
            const keyboardHeight = window.innerHeight - vv.height;
            setKeyboardOffset(keyboardHeight > 0 ? keyboardHeight : 0);
        };

        vv.addEventListener('resize', updateOffset);
        vv.addEventListener('scroll', updateOffset);
        updateOffset();

        return () => {
            vv.removeEventListener('resize', updateOffset);
            vv.removeEventListener('scroll', updateOffset);
        };
    }, []);

    return (
        <div className="fixed inset-0 flex flex-col">
            {status === 'success' 
                ? (<>
                    <Header conversation={data?.conversation} currentUser={session?.user}/>
                    <div className="flex-1 overflow-y-auto">
                        <Body />
                    </div>
                    <div
                        className="shrink-0 bg-white border-t border-gray-200 transition-transform duration-200"
                        style={{ transform: `translateY(-${keyboardOffset}px)` }}
                    >
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
