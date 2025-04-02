'use client';
import EmptyState from "@/src/app/components/EmptyState";
import getConversationById from "@/src/app/lib/getConversationById";
import UnavailableChatForm from "@/src/app/components/UnavailableChatForm";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Header from "@/src/app/components/chat/Header";
import Body from "@/src/app/components/chat/Body";
import Form from "@/src/app/components/chat/Form";
import { useEffect } from "react";
import useWindowSize from "@/src/app/hooks/useWindowSize";
import clsx from "clsx";

interface IParams {
    conversationId: string;
}

const Conversation = ({ params }: { params : IParams }) => {    
    const { data: session } = useSession();
    const windowSize = useWindowSize();
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

    // useEffect(() => {
    //     const setVh = () => {
    //       const vh = window.innerHeight * 0.01;
    //       document.documentElement.style.setProperty('--vh', `${vh}px`);
    //     };
      
    //     setVh();
    //     window.addEventListener('resize', setVh);
      
    //     return () => window.removeEventListener('resize', setVh);
    // }, []);

    return (
        <div className={clsx(`page-container`,
             windowSize.height && `md:h-[${windowSize.height}px] h-[calc(var(${windowSize.height}, 1dvh) * 100 - 55px)]`
        )}>
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
