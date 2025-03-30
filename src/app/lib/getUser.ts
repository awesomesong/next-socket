import { BASE_URL } from "@/config";

const getUser = async () => {
    const res = await fetch(`${BASE_URL}/api/user`,{
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    }); 

    const { userInfo, message } = await res.json();

    return { userInfo, message };
}

export default getUser
