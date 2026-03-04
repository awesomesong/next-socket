import ScentMemoriesHero from "@/src/app/components/main/ScentMemoriesHero";
import ProductFragrance from "@/src/app/components/main/ProductFragrance";

export default async function Home() {

  return (
    <div className='flex flex-col'>
      <ScentMemoriesHero />
      <ProductFragrance />
    </div>
  );
}
