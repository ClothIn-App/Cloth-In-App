import type { Product } from "@/src/types/content";
import type { ProductFormData } from "@/components/create/product/addproductcontext";

export function mapProductToInitialForm(product: Product): Partial<ProductFormData> {
  const photos: string[] = [];
  if (product.images?.length) {
    photos.push(...product.images.filter(Boolean));
  } else if (product.imagePath) {
    photos.push(product.imagePath);
  }

  const pt = product.priceType ?? "fixed";
  const priceStr =
    pt === "tbd" || pt === "na"
      ? ""
      : product.price != null
        ? String(product.price)
        : "";
  const origStr =
    product.originalPrice != null ? String(product.originalPrice) : "";

  return {
    category: product.category?.trim() ?? "",
    brand: product.brand ?? "",
    productName: product.name ?? "",
    color: product.color ?? "",
    specifications: product.specs ?? "",
    description: product.description ?? "",
    link: product.productUrl ?? "",
    photos,
    priceType: pt,
    price: priceStr,
    originalPrice: origStr,
  };
}
