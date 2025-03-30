import { IUser } from '@/src/app/types/common';
import { createContext } from 'react';

export const UserContext = createContext({
    id: '',
    email: '',
    providers: '',
    image: '',
});