/**
 * Whether color is optional for create-product validation, based on the
 * category path from CategorySelect (e.g. "Clothing > Tops > T-shirts").
 */
export function isColorOptionalForCategory(path: string): boolean {
  const p = path.trim();
  if (!p) return true;
  if (p.startsWith('Beauty →')) return true;
  if (p.startsWith('Nails')) return true;
  if (p.startsWith('Fitness Gear')) return true;
  if (p.startsWith('Home & Decor')) return true;
  if (p === 'Jewelry > Watches') return true;
  if (p === 'Other / Not Listed') return true;
  return false;
}
