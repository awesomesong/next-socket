import toast from "react-hot-toast";

const getConversations = async () => {
    const res = await fetch(`/api/conversations`,{
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
