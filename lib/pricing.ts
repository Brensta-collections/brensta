import type { Decimal } from "@prisma/client/runtime/library";

type Priceable = {
  basePrice: Decimal | number | string;
  baseSalePrice?: Decimal | number | string | null;
};

type VariantPriceable = {
  price: Decimal | number | string;
  salePrice?: Decimal | number | string | null;
};

function num(x: Decimal | number | string | null | undefined): number {
  if (x === null || x === undefined) return NaN;
  return typeof x === "number" ? x : Number(x.toString());
}

export function productDisplayPrice(p: Priceable, variants: VariantPriceable[] = []) {
  if (variants.length > 0) {
    const effectives = variants.map((v) => {
      const sale = num(v.salePrice);
      const price = num(v.price);
      return Number.isFinite(sale) ? sale : price;
    });
    const prices = variants.map((v) => num(v.price));
    const min = Math.min(...effectives);
    const list = Math.min(...prices);
    const onSale = min < list;
    return { price: min, list: onSale ? list : undefined, onSale };
  }
  const list = num(p.basePrice);
  const sale = num(p.baseSalePrice);
  const onSale = Number.isFinite(sale) && sale < list;
  return { price: onSale ? sale : list, list: onSale ? list : undefined, onSale };
}

export function discountPct(list: number, price: number): number {
  if (!list || list <= price) return 0;
  return Math.round(((list - price) / list) * 100);
}

export function totalStock(variants: Array<{ stock: number }>): number {
  return variants.reduce((s, v) => s + (v.stock ?? 0), 0);
}
