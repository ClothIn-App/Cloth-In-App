/**
 * Closet shape from GET /users/get (user.closet). Used by ClosetTab and other-user closet.
 */

export type ClosetRack = {
  id: string;
  name: string;
  productIds: string[];
  createdAt?: number;
};

export type NormalizedCloset = {
  baseProductIds: string[];
  racks: ClosetRack[];
};

/** Raw API / Firestore closet payload (partial). */
export type ClosetPayload = {
  base?: { productIds?: string[] };
  racks?: Array<{
    id?: string;
    name?: string;
    productIds?: string[];
    createdAt?: number;
  }>;
};

/**
 * Normalize user.closet for UI: base ids, racks with id+name only, stable for display.
 */
export function normalizeClosetFromUser(closet: unknown): NormalizedCloset {
  if (!closet || typeof closet !== "object") {
    return { baseProductIds: [], racks: [] };
  }
  const c = closet as ClosetPayload;
  const baseProductIds = c.base?.productIds ?? [];
  const racks = (c.racks ?? [])
    .filter((rack): rack is NonNullable<typeof rack> & { id: string; name: string } => {
      return Boolean(rack?.id && rack?.name);
    })
    .map((rack) => ({
      id: rack.id,
      name: rack.name,
      productIds: rack.productIds ?? [],
      createdAt: rack.createdAt,
    }));
  return { baseProductIds, racks };
}
