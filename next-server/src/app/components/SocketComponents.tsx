"use client";
import { useSocket } from "../context/socketContext";
import { IUserList } from "@/src/app/types/common";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function SocketComponents({user}: {user?: IUserList}) {
    const socket = useSocket();
    const {data: session , status} = useSession();
    const [isConnected, setIsConnected] = useState(false);
    const [transport, setTransport] = useState("N/A");

    useEffect(() => {
        if(status !== "authenticated" || !socket) return;

        function onConnect() {
            if(!socket) return;

            setIsConnected(true);
            setTransport(socket.io.engine.transport.name);
            
            socket.io.engine.on("upgrade", (transport) => {
                setTransport(transport.name);
            });
            
            if( session?.user?.email && socket?.connected) {
                socket.emit("online:user", { useremail: session.user.email, userId: session.user.id });
            }
        }

        if (socket.connected) {
            onConnect();
        }

        function onDisconnect() {
            setIsConnected(false);
            setTransport("N/A");
        }

        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
        };
    }, [session, status, socket]);

    return null;
}