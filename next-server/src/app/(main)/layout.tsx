import ChatMenu from "@/src/app/components/ChatMenu";
import { Header } from "@/src/app/components/Header";
import Footer from "@/src/app/components/Footer";

export default function Layout({ children }: {
    children: React.ReactNode;
}) {

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
            <Footer />
        </>
    )
}