import type { Product } from "@/src/types/content";

let stashed: { id: string; product: Product } | undefined;

export function stashProductForEdit(product: Product): void {
  stashed = { id: product.id, product };
}

export function takeProductForEditIfMatch(productId: string): Product | undefined {
  if (stashed?.id === productId) {
    const p = stashed.product;
    stashed = undefined;
    return p;
  }
  return undefined;
}
