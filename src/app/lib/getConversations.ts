import { BASE_URL } from "@/config";
import toast from "react-hot-toast";

const getConversations = async () => {
    const res = await fetch(`${BASE_URL}/api/conversations`,{
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    }); 

    const { conversations, message } = await res.json();

    if (!res.ok) {
        toast.error(message);
    }

    return { conversations, message };
}

export default getConversations;
