import { User } from "@prisma/client";

export interface IUser {
    user: {
        role?: string | null | undefined;
        id: string;
        name?: string | null | undefined;
        email?: string | null | undefined;
        image?: string | null | undefined;
    } | User;
}

export interface IUserList {
    id: string | null;
    name?: string | null | undefined;
    email?: string | null | undefined;
    image?: string | null | undefined;
    role?: string | null | undefined;
}

export interface IUserListOptions {
    createdAt?: string | null | undefined;
    updatedAt?: string | null | undefined;
}

export interface ModalProps {
    isOpen?: boolean;
    onCloseModal: () => void;
    children?: React.ReactNode; 
    name?: string | null | undefined;
}

export interface AuthSocialProps {
    onClick: (value: boolean) => void;
    disabled?: boolean; 
}