'use client';
import useConversation from '@/src/app/hooks/useConversation';
import { useEffect, useRef, useState } from 'react';
import MessageView from './MessageView';
import { FullMessageType } from '@/src/app/types/conversation';
import { DefaultSession } from 'next-auth';
import { pusherClient } from '@/src/app/lib/_pusher';
// import { find } from 'lodash';
import { useSocket } from '../../context/socketContext';

interface BodyProps {
    initialMessages: FullMessageType[];
    currentUser: DefaultSession["user"];
}

const Body:React.FC<BodyProps> = ({ initialMessages, currentUser }) => {
    const socket = useSocket();
    const [ messages, setMessages ] = useState(initialMessages);
    const bottomRef = useRef<HTMLDivElement>(null);
    const { conversationId } = useConversation();

    const seenMessage = fetch(`/api/conversations/${conversationId}/seen`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            conversationId
        })
    });

    useEffect(() => {
        seenMessage;
    }, [conversationId]);

    useEffect(() => {
        bottomRef?.current?.scrollIntoView({ behavior: "smooth",  block: "end"});
        pusherClient.subscribe(conversationId);
        const messageHandler = (message: FullMessageType) => {
            seenMessage;

            setMessages((current) => {
                if(find(current, {id: message.id})) {
                    return current;
                }

                return [...current, message];
            });    
            // bottomRef?.current?.scrollIntoView({ behavior: "smooth", block: "end"});
        }

        const updateMessageHandler = (newMessage: FullMessageType) => {
            setMessages((current) => current.map((currentMessage) => {
                if(currentMessage.id === newMessage.id) {
                    return newMessage;
                }

                return currentMessage;
            }))
        };

        pusherClient.bind('messages:new', messageHandler);
        pusherClient.bind('message:update', updateMessageHandler);
        return () => {
            pusherClient.unsubscribe(conversationId);
            pusherClient.unbind('messages:new', messageHandler);
            pusherClient.unbind('messages:update', updateMessageHandler);
        }
    }, [conversationId]);

    useEffect(() => {
        bottomRef?.current?.scrollIntoView({ behavior: "smooth", block: "end"});
    }, [messages]);

    useEffect(() => {
        if(!socket) return;
        socket.on("getMessage", (message: FullMessageType) => {
            seenMessage;

            setMessages((current) => {
                if(find(current, {id: message.id})) {
                    return current;
                }

                return [...current, message];
            });    
        });
    
        return () => {
            socket.off("getMessage");
        };
    }, [conversationId]);

    return (
        <div className="flex-1 overflow-y-auto ui-chat">
            {/* {messages.map((message, i) => (
                <MessageView
                    key={message.id}
                    isLast={i === Object.keys(messages).length - 1}
                    data={message}
                    currentUser={currentUser}
                />
            ))} */}
            <div ref={bottomRef} />
        </div>
    )
}

export default Body
