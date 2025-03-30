import type { Metadata } from "next";

export const metadata: Metadata = {
    title: {
      default: "Framer Motion 기반 인터랙티브 포트폴리오",
      template: "%s | Framer Motion 포트폴리오",
    },
    description:
      "Framer Motion을 활용한 인터랙션 중심 포트폴리오. 부드러운 애니메이션과 몰입감 있는 UI를 보여줍니다.",
    openGraph: {
      title: "Framer Motion 기반 인터랙티브 포트폴리오",
      description:
        "Framer Motion으로 구현된 하이트 맥주 애니메이션과 포트폴리오 콘텐츠를 만나보세요.",
      url: "https://yourdomain.com",
      images: [
        {
          url: "/image/interactive_portfolio_og.png",
          width: 1200,
          height: 630,
          alt: "인터랙티브 포트폴리오 미리보기",
        },
      ],
    },
};

export default async function HomeLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
  
    return (
        <>
          {children}
        </>
    )
}