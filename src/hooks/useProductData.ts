import { useMemo } from "react";
import { Product, FitPic } from "../types/content";
import productsData from "../mocks/mock-products.json";
import fitpicsData from "../mocks/mock-fitpics.json";

type UseProductDataResult = {
  product: Product | undefined;
  featuredFitPics: FitPic[];
};

export function useProductData(productId: string | undefined): UseProductDataResult {
  const { product, featuredFitPics } = useMemo(() => {
    if (!productId) {
      return {
        product: undefined,
        featuredFitPics: [],
      };
    }

    // Find the product by id
    const product = (productsData.products as Product[]).find(
      (p) => p.id === productId
    );

    // Map fitpics to add productsUsed field (derived from featuredProductIds or featuredProducts)
    const allFitPics: FitPic[] = fitpicsData.fitpics.map((fp: any) => ({
      ...fp,
      productsUsed: fp.featuredProductIds || fp.featuredProducts,
    })) as FitPic[];

    // Filter fitpics that include this product id in productsUsed
    const featuredFitPics = allFitPics.filter((fp) =>
      Array.isArray(fp.productsUsed) && fp.productsUsed.includes(productId)
    );

    return {
      product,
      featuredFitPics,
    };
  }, [productId]);

  return { product, featuredFitPics };
}

