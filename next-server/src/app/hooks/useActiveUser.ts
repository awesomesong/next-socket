import { useSocket } from "../context/socketContext";
import { useEffect } from "react";
import useActiveList from "./useActiveList";

interface IonlineUsers {
    socketId: string;
    useremail: string;
}

const useActiveUser = () => {
    const socket = useSocket();
    const { members, add, remove } = useActiveList();

    useEffect(() => {
        if(!socket) return;

        socket.on("get:onlineUsers", (users) => {
            users.map((user: IonlineUsers) => !members.includes(user.useremail) && add(user.useremail));
        });

        socket.on("register:user", (useremail) => {
            add(useremail);
        });

        socket.on("leave:user", (useremail) => {
            remove(useremail);
        });
    
        return () => {
            socket.off("onlineUsers");
            socket.off("register:user");
            socket.off("leave:user");
        }
    }, [ socket ]); 
}

export default useActiveUser;
