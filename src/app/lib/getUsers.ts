import { BASE_URL } from "@/config";
import toast from "react-hot-toast";


const getUsers = async () => {
    const res = await fetch(`${BASE_URL}/api/chatMember`,{
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    }); 

    const { users, message } = await res.json();

    if (!res.ok) {
        toast.error(message);
    }

    return { users, message };
}

export default getUsers;