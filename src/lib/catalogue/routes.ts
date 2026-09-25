type ProductWithSlug = {
  slug: string;
};

export function getProductUrl(product: ProductWithSlug): string {
  return `/cables/${product.slug}/`;
}
