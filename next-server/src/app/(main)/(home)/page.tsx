import ScentMemoriesHero from "@/src/app/components/main/ScentMemoriesHero";
import ProductFragrance from "@/src/app/components/main/ProductFragrance";
import GuideBanner from "@/src/app/components/main/GuideBanner";

export default async function Home() {

  return (
    <div className='flex flex-col relative'>
      <GuideBanner />
      <ScentMemoriesHero />
      <ProductFragrance />
    </div>
  );
}
