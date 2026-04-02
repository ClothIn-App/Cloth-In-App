/** Mirrors cloth-in-server `app/services/product_color_suggest.py` for mock + parity. */

const TIER_WEIGHT_A = 3_000_000;
const TIER_WEIGHT_B1 = 2_000_000;
const TIER_WEIGHT_B2 = 1_000_000;

const NAME_EXACT = 10_000;
const NAME_SUBSTRING = 6_000;
const NAME_TOKEN_UNIT = 800;
const NAME_TOKEN_CAP = 4_000;
const CATEGORY_BONUS = 2_000;
const BRAND_BONUS = 500;

export type ProductColorDoc = {
  color?: string | null;
  name?: string | null;
  brand?: string | null;
  brandId?: string | null;
  category?: string | null;
};

function norm(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

function tokenize(name: string): Set<string> {
  const parts = name.toLowerCase().split(/[^\w]+/);
  return new Set(parts.filter((p) => p.length >= 2));
}

export function brandDocMatch(
  doc: ProductColorDoc,
  brandId: string | undefined,
  brandName: string | undefined
): boolean {
  const bid = (brandId ?? "").trim();
  if (bid) {
    return norm(doc.brandId) === bid.toLowerCase();
  }
  const bn = (brandName ?? "").trim();
  if (bn) {
    return norm(doc.brand) === bn.toLowerCase();
  }
  return false;
}

export function categoryDocMatch(
  doc: ProductColorDoc,
  categoryParam: string | undefined
): boolean {
  const cat = norm(categoryParam);
  const docCat = norm(doc.category);
  if (!cat) return true;
  return docCat === cat;
}

export function minProductNameSignal(
  productName: string | undefined,
  docName: string | undefined
): boolean {
  const pn = (productName ?? "").trim();
  const dn = (docName ?? "").trim();
  if (!pn) return true;
  if (!dn) return false;
  const pl = pn.toLowerCase();
  const dl = dn.toLowerCase();
  if (pl === dl) return true;
  if (pl.includes(dl) || dl.includes(pl)) return true;
  const pt = tokenize(pn);
  const dt = tokenize(dn);
  for (const t of pt) {
    if (dt.has(t)) return true;
  }
  return false;
}

function assignTier(
  doc: ProductColorDoc,
  brandId: string | undefined,
  brandName: string | undefined,
  categoryParam: string | undefined,
  productName: string | undefined
): number {
  const b = brandDocMatch(doc, brandId, brandName);
  const catOk = categoryDocMatch(doc, categoryParam);
  const nameOk = minProductNameSignal(productName, doc.name ?? undefined);
  if (b && catOk && nameOk) return 2;
  if (b) return 1;
  return 0;
}

function tierWeight(tierCode: number): number {
  if (tierCode === 2) return TIER_WEIGHT_A;
  if (tierCode === 1) return TIER_WEIGHT_B1;
  return TIER_WEIGHT_B2;
}

export function scoreDocForColorSuggestion(
  doc: ProductColorDoc,
  productName: string | undefined,
  categoryParam: string | undefined,
  brandId: string | undefined,
  brandName: string | undefined
): number {
  const pn = (productName ?? "").trim();
  const dn = (doc.name ?? "").trim();
  let score = 0;
  if (pn && dn) {
    const pl = pn.toLowerCase();
    const dl = dn.toLowerCase();
    if (pl === dl) score += NAME_EXACT;
    else if (pl.includes(dl) || dl.includes(pl)) score += NAME_SUBSTRING;
    else {
      const overlap = [...tokenize(pn)].filter((t) => tokenize(dn).has(t))
        .length;
      score += Math.min(NAME_TOKEN_CAP, overlap * NAME_TOKEN_UNIT);
    }
  }
  const cat = norm(categoryParam);
  if (cat && norm(doc.category) === cat) score += CATEGORY_BONUS;
  if (brandDocMatch(doc, brandId, brandName)) score += BRAND_BONUS;
  return score;
}

export function suggestProductColors(
  docs: ProductColorDoc[],
  q: string,
  opts: {
    productName?: string;
    category?: string;
    brandId?: string;
    brandName?: string;
    limit?: number;
  } = {}
): string[] {
  const qLower = q.trim().toLowerCase();
  if (!qLower) return [];

  const {
    productName,
    category,
    brandId,
    brandName,
    limit = 20,
  } = opts;

  const best = new Map<string, { composite: number; display: string }>();

  for (const doc of docs) {
    const rawColor = doc.color;
    if (rawColor == null) continue;
    const colorStr = String(rawColor).trim();
    if (!colorStr) continue;
    if (!colorStr.toLowerCase().includes(qLower)) continue;

    const tierC = assignTier(doc, brandId, brandName, category, productName);
    const tw = tierWeight(tierC);
    const inner = scoreDocForColorSuggestion(
      doc,
      productName,
      category,
      brandId,
      brandName
    );
    const composite = tw + inner;
    const ckey = colorStr.toLowerCase();
    const prev = best.get(ckey);
    if (!prev || composite > prev.composite) {
      best.set(ckey, { composite, display: colorStr });
    }
  }

  return [...best.values()]
    .sort((a, b) => b.composite - a.composite)
    .slice(0, limit)
    .map((x) => x.display);
}
