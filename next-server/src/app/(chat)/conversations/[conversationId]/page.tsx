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

interface IParams {
    conversationId: string;
}

const Conversation = ({ params }: { params : IParams }) => {    
    const { data: session } = useSession();
    const conversationId = params.conversationId;
    const windowSize = useWindowSize();

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
        <div 
            className="page-container"
            style={{
                height:
                    windowSize.height && windowSize.width
                    ? windowSize.width >= 768
                      ? `${windowSize.height}px` // 👈 폭이 넓을 때
                      : `calc(${windowSize.height}px - 55px)` // 👈 폭이 좁을 때
                    : undefined,
            }}
        >
            <div 
                className="flex flex-col"
                style={{
                    height:
                        windowSize.height && windowSize.width
                        ? windowSize.width >= 768
                          ? `${windowSize.height}px` // 👈 폭이 넓을 때
                          : `calc(${windowSize.height}px - 55px)` // 👈 폭이 좁을 때
                        : undefined,
                }}
            >
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
