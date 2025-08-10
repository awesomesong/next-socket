'use client';
import useConversation from "@/src/app/hooks/useConversation";
import { FullConversationType, FullMessageType } from "@/src/app/types/conversation";
import { useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import { MdOutlineGroupAdd } from 'react-icons/md'
import ConversationBox from "./ConversationBox";
import { DefaultSession } from "next-auth";
// import { find } from "lodash";
import { IUserList } from "@/src/app/types/common";
import { pusherClient } from "@/src/app/lib/_pusher";
import GroupChatModal from "./chat/GroupChatModal";

interface ConversationListProps {
    initialItems: FullConversationType[];
    currentUser: DefaultSession["user"];
    users: IUserList[] & DefaultSession["user"];
}

const ConversationList:React.FC<ConversationListProps> = ({
    initialItems,
    currentUser,
    users,
}) => {
    const [items, setItems] = useState(initialItems);
    const [ isModalOpen, setIsModaOpen ] = useState(false);
    const router = useRouter();
    const { conversationId, isOpen } = useConversation();
    const pusherKey = currentUser?.email;

    useEffect(() => {
        setItems(initialItems);
    }, [initialItems]);

    useEffect(() => {
        if(!pusherKey) return; 

        pusherClient.subscribe(pusherKey);
        pusherClient.subscribe(conversationId);
        const newConversationHandler = (conversation: FullConversationType) => {

            setItems((current) => {
                if(find(current, { id: conversation.id })) {
                    return current;
                }

                return [conversation, ...current];
            });
        };

        const updateMessageHandler = (conversation: FullConversationType) => {

            setItems((current) => 
                current.map((currentConversation) => {
                    if(currentConversation.id === conversation.id) {
                        return {
                            ...currentConversation, 
                            messages: conversation.messages,
                        }
                    }
                    return currentConversation;
                })
            );
        };

        const removeConversationHandler = (conversation: FullConversationType) => {
            setItems((current) => {
                return [...current.filter((currentConversation) => currentConversation.id !== conversation.id)] 
            });

            if(conversationId === conversation.id){
                router.push('/conversations');
            }
        };

        const messageHandler = (message: FullMessageType) => {
            const existingConversation = items.filter((item) => {
                if(item.id === message.conversationId){
                    return item;
                }
            });

            setItems((current) => {
                return [...current.filter((currentConversation) => currentConversation.id !== message.conversationId)] 
            });

            if(existingConversation){
                setItems((current) => {
                    return [existingConversation[0], ...current]; 
                });
            }

        };

        pusherClient.bind('messages:new', messageHandler);
        pusherClient.bind('conversation:new', newConversationHandler);
        pusherClient.bind('conversation:update',updateMessageHandler);
        pusherClient.bind('conversation:remove', removeConversationHandler);

        return () => {
            if(pusherKey) {
                pusherClient.unsubscribe(pusherKey);
                pusherClient.unsubscribe(conversationId);
                pusherClient.unbind('messages:new', messageHandler);
                pusherClient.unbind('conversation:new', newConversationHandler);
                pusherClient.unbind('conversation:update',updateMessageHandler);
                pusherClient.unbind('conversation:remove', removeConversationHandler);
            }
        }
    }, [pusherKey, conversationId]);

    return (
        <>
            {/* <GroupChatModal
                users={users}
                isOpen={isModalOpen}
                onCloseModal={() => setIsModaOpen(false)}
            /> */}
            <aside className='
                    shrink-0
                    overflow-y-auto
                    w-full
                    h-full
                    border-r-default
                    lg:w-80
                    lg:block
                '>
                <div className="flex 
                                justify-between
                                items-center
                                h-16
                                px-3
                    ">
                    <div className="
                        text-2xl
                        font-bold
                    ">
                        대화방
                    </div>
                    <div 
                        onClick={() => setIsModaOpen(true)}
                        className="
                            rounded-full
                            p-2
                            cursor-pointer
                            bg-neutral-200
                            dark:bg-neutral-700
                            hover:opacity-75
                            transition
                        "
                    >
                        <MdOutlineGroupAdd size={24} />
                    </div>
                </div>
                <div className="flex flex-col">
                    {/* {items.map((item) => (
                        <ConversationBox
                            key={item.id}
                            data={item}
                            selected={conversationId === item.id}
                            currentUser={currentUser}
                        />
                    ))} */}
                    </div>
            </aside>
        </>
    )
}

export default ConversationList;
