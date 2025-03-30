import ChatMenu from "@/components/ChatMenu";
import { Header } from "@/components/Header";

export default function Layout({ children } : {
    children: React.ReactNode;
}){
  
    return (
        <>
            <Header />
            <div className="
                flex-1
                w-full
                m-auto
            ">
                {children}
                <ChatMenu />
            </div>
        </>
    )
}