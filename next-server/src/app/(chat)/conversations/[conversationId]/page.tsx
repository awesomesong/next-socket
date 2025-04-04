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
import { useSocket } from '../../../context/socketContext';

interface IParams {
    conversationId: string;
}

const Conversation = ({ params }: { params : IParams }) => {   
    const socket = useSocket(); 
    const { data: session } = useSession();
    const conversationId = params.conversationId;

    const { 
        data, 
        status,
        refetch
    } = useQuery({
        queryKey: ['conversation', conversationId],
        queryFn: () => getConversationById(conversationId),
        enabled: !!conversationId, 
    });

    useEffect(() => {
        if(!socket) return; 

        const handleReconnect = () => {
            console.log('@@connect', socket);
            socket.emit('join:room', conversationId); // 방 재입장
            refetch(); // 메시지 다시 불러오기 ✅
        };
      
        socket.on('connect', handleReconnect);
      
        return () => {
          socket.off('connect', handleReconnect);
        };
    }, [conversationId]);

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
        <div className="flex flex-col w-full relative">
            {status === 'success' 
                ? (<div className="flex flex-col flex-1 overflow-hidden">
                    <Header conversation={data?.conversation} currentUser={session?.user}/>
                    <Body />
                    {isForm ? <Form /> : <UnavailableChatForm />}
                </div>)
                : (<div className="flex-1 flex justify-center items-center">
                    <progress className="pure-material-progress-circular"/>
                </div>)
            }
        </div>
    )
}

export default Conversation;
