import { useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { FullConversationType } from "../types/conversation";
import {  User } from "@prisma/client";
import { DefaultSession } from "next-auth";

const useOtherUser = (conversation: FullConversationType | {
        users: User[];
    }, currentUser?: DefaultSession["user"]
) => {
    
    const { data: session , status } = useSession();
    
    const otherUser = useMemo(() => {
        // const currentUserEmail = session?.user?.email;

        const otherUser = conversation?.users?.filter((user) => user.email !== currentUser?.email);

        return otherUser?.length > 0 ? otherUser[0] : {email: 'None', 
                                                      name: '(대화상대 없음)', 
                                                      id: null, 
                                                      createdAt: null, 
                                                      updatedAt: null, 
                                                      image: 'None',
                                                      role: null,
                                                    };    
    },[currentUser?.email, conversation?.users]);
    
    return { otherUser, otherUserStatus: status};
};

export default useOtherUser
