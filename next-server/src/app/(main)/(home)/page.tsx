import ScentMemoriesHero from "@/src/app/components/main/ScentMemoriesHero";
import ProductFragrance from "@/src/app/components/main/ProductFragrance";
import IntroNoticeBanner from "@/src/app/components/main/IntroNoticeBanner";

export default async function Home() {

  return (
    <div className='flex flex-col relative'>
      <IntroNoticeBanner />
      <ScentMemoriesHero />
      <ProductFragrance />
    </div>
  );
}
