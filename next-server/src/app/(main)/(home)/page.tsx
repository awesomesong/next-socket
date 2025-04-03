import ProductBeer from "@/src/app/components/main/ProductBeer";
import ProductSoju from "@/src/app/components/main/ProductSoju";
import ProductDrink from "@/src/app/components/main/ProductDrink";
import ProductInternational from "@/src/app/components/main/ProductInternational";
import ProductWhiskey from "@/src/app/components/main/ProductWhiskey";

export default async function Home() {
  
    return (
      <div className='flex flex-col'>  
        <ProductBeer />
        <ProductSoju /> 
        <ProductWhiskey /> 
        <ProductDrink />
        <ProductInternational />
      </div>
    );
  }
  