import ScentMemoriesHeroLazy from "@/src/app/components/main/ScentMemoriesHeroLazy";
import ProductFragranceLazy from "@/src/app/components/main/ProductFragranceLazy";
import GuideBannerLazy from "@/src/app/components/main/GuideBannerLazy";

export default async function Home() {

  return (
    <div className='flex flex-col relative'>
      <GuideBannerLazy />
      <ScentMemoriesHeroLazy />
      <ProductFragranceLazy />
    </div>
  );
}
