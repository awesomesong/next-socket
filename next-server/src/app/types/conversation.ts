import { Conversation, Message, User } from "@prisma/client";
import { IUser, IUserList } from "./common";

type ReadStatuses = {
    id: string;
    userId: string;
    isRead: boolean;
}

export type FullMessageType = Message & {
    sender: User;
    seen: User[];
    readStatuses: ReadStatuses[];
    conversation: {
        isGroup: boolean | null;
        userIds: string[];
    }
}

export type MessageType = Message & {
    sender: User;
    seen: User[];
    readStatuses: ReadStatuses[];
}

export type FullConversationType = Conversation & {
    users: IUserList[];
    messages: MessageType[];
    unreadCount?: number;
}

export type ConversationProps = {
    conversations: FullConversationType[]
}