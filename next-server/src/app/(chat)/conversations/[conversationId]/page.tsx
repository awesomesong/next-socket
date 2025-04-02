'use client';
import EmptyState from "@/src/app/components/EmptyState";
import getConversationById from "@/src/app/lib/getConversationById";
import UnavailableChatForm from "@/src/app/components/UnavailableChatForm";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Header from "@/src/app/components/chat/Header";
import Body from "@/src/app/components/chat/Body";
import Form from "@/src/app/components/chat/Form";
import { useCallback, useEffect, useRef } from "react";
import { useKeyboardSafeHeight } from "@/src/app/hooks/useKeyboardSafeHeight";
import useWindowSize from "@/src/app/hooks/useWindowSize";

interface IParams {
    conversationId: string;
}

const Conversation = ({ params }: { params : IParams }) => {    
    const { data: session } = useSession();
    const conversationId = params.conversationId;
    const windowSize = useWindowSize();
    const safeHeight = useKeyboardSafeHeight();
    const divRef = useRef<HTMLDivElement>(null);

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

    const applyHeight = useCallback(() => {
        if (safeHeight && divRef.current) {
          const screenWidth = window.innerWidth;
    
          if (screenWidth < 768) {
            divRef.current.style.height = `${safeHeight - 55}px`;
          } else {
            divRef.current.style.height = `${safeHeight}px`;
          }
        }
    }, [safeHeight]);
    
    useEffect(() => {
        applyHeight(); // 초기 적용
    
        window.addEventListener('resize', applyHeight); // 리사이즈 시에도 적용
    
        return () => {
          window.removeEventListener('resize', applyHeight); // 클린업
        };
    }, [applyHeight]);
    

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
        <div className="page-container">
            {status === 'success' 
                ? (<div ref={divRef} 
                    className="flex flex-col"
                    style={{
                        height:
                            windowSize.height && windowSize.width
                            ? windowSize.width >= 768
                            ? `${windowSize.height}px`
                            : `calc(${windowSize.height}px - 55px)`
                            : undefined,
                    }}
                >
                    <Header conversation={data?.conversation} currentUser={session?.user}/>
                    <Body />
                    {isForm ? <Form /> : <UnavailableChatForm />}
                </div>)
                : (<div className="flex-1 flex justify-center items-center">
                    <progress className="pure-material-progress-circular max-md:-mt-[55px]"/>
                </div>)
            }
        </div>
    )
}

export default Conversation;
