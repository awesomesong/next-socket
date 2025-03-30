import ProductBeer from "@/components/main/ProductBeer";
import ProductSoju from "@/components/main/ProductSoju";
import ProductDrink from "@/components/main/ProductDrink";
import ProductInternational from "@/components/main/ProductInternational";
import ProductWhiskey from "@/components/main/ProductWhiskey";

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
  