/**
 * Demo product seed.
 * All SKUs are prefixed "DEMO-" and all images use the placeholder: scheme
 * so the storefront renders a branded placeholder (not a real product photo).
 * Safe to re-run (idempotent on slug).
 */
import { PrismaClient, PublishStatus } from "@prisma/client";

const prisma = new PrismaClient();

type DemoProduct = {
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  categoryPaths: string[]; // first is primary
  basePrice: number;
  baseSalePrice?: number;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  attributes?: Record<string, string | number>;
  variants: Array<{
    skuSuffix: string;
    optionValues: Record<string, string>;
    price?: number;
    salePrice?: number;
    stock: number;
  }>;
};

const PRODUCTS: DemoProduct[] = [
  // ───────────── Jewellery > Earrings/Jhumkas/Bracelets/Rings/Necklaces ─────────────
  {
    slug: "pearl-square-drop-earrings",
    name: "Pearl Square Drop Earrings",
    shortDescription: "Elegant pearl-studded square drop earrings for everyday grace.",
    description: "Hand-set freshwater pearls on a champagne-tone square base. Lightweight, nickel-free posts.",
    categoryPaths: ["/jewellery/earrings", "/jewellery"],
    basePrice: 499,
    baseSalePrice: 299,
    isFeatured: true,
    attributes: { material_jewel: "Pearl", plating: "Gold", stone: "Pearl", occasion: "Festive" },
    variants: [{ skuSuffix: "001", optionValues: { Metal: "Gold" }, stock: 25 }],
  },
  {
    slug: "flower-jhumkas-ivory",
    name: "Ivory Flower Jhumkas",
    shortDescription: "Classic flower-shaped jhumkas with pearl drops.",
    description: "Traditional silhouette, modern finish. Pairs beautifully with sarees and kurtas.",
    categoryPaths: ["/jewellery/jhumkas", "/jewellery"],
    basePrice: 349,
    baseSalePrice: 259,
    isFeatured: true,
    attributes: { material_jewel: "Alloy", plating: "Gold", occasion: "Wedding" },
    variants: [{ skuSuffix: "001", optionValues: { Metal: "Gold" }, stock: 18 }],
  },
  {
    slug: "red-teal-stone-bracelet",
    name: "Red & Teal Stone Bracelet",
    shortDescription: "Statement bracelet with multi-stone detailing.",
    description: "Semi-precious inspired stones hand-set in an adjustable band.",
    categoryPaths: ["/jewellery/bracelets", "/jewellery"],
    basePrice: 599,
    baseSalePrice: 349,
    isFeatured: true,
    attributes: { material_jewel: "Alloy", stone: "Semi-Precious", occasion: "Party" },
    variants: [{ skuSuffix: "001", optionValues: { Size: "One Size" }, stock: 32 }],
  },
  {
    slug: "minimal-gold-ring",
    name: "Minimal Gold Ring",
    shortDescription: "A delicate everyday ring with a subtle shine.",
    description: "Hypoallergenic alloy with 18k gold plating. Tarnish-resistant.",
    categoryPaths: ["/jewellery/rings", "/jewellery"],
    basePrice: 349,
    baseSalePrice: 199,
    isFeatured: true,
    attributes: { material_jewel: "Alloy", plating: "Gold" },
    variants: [
      { skuSuffix: "S", optionValues: { Size: "Small" }, stock: 15 },
      { skuSuffix: "M", optionValues: { Size: "Medium" }, stock: 20 },
      { skuSuffix: "L", optionValues: { Size: "Large" }, stock: 10 },
    ],
  },
  {
    slug: "oxidised-jhumkas",
    name: "Oxidised Silver Jhumkas",
    shortDescription: "Boho-chic oxidised jhumkas with ghungroo detailing.",
    description: "Hand-crafted oxidised silver finish with signature ghungroos.",
    categoryPaths: ["/jewellery/jhumkas", "/jewellery"],
    basePrice: 399,
    baseSalePrice: 249,
    isNewArrival: true,
    attributes: { material_jewel: "Oxidised", occasion: "Casual" },
    variants: [{ skuSuffix: "001", optionValues: { Metal: "Oxidised" }, stock: 22 }],
  },
  {
    slug: "kundan-choker-necklace",
    name: "Kundan Choker Necklace",
    shortDescription: "Regal kundan choker for festive looks.",
    description: "Traditional kundan work on a gold-tone base. Includes matching earrings.",
    categoryPaths: ["/jewellery/necklaces", "/jewellery"],
    basePrice: 1899,
    baseSalePrice: 1299,
    isFeatured: true,
    isNewArrival: true,
    attributes: { material_jewel: "Kundan", plating: "Gold", occasion: "Wedding" },
    variants: [{ skuSuffix: "001", optionValues: { Length: "Choker" }, stock: 8 }],
  },
  {
    slug: "pearl-pendant-chain",
    name: "Pearl Pendant Chain",
    shortDescription: "Dainty pearl pendant on a fine gold-tone chain.",
    description: "Minimal everyday pendant with a hand-set pearl at the centre.",
    categoryPaths: ["/jewellery/pendants", "/jewellery"],
    basePrice: 599,
    attributes: { material_jewel: "Pearl", plating: "Gold" },
    variants: [{ skuSuffix: "001", optionValues: { Length: "18 inch" }, stock: 24 }],
  },
  {
    slug: "stone-bangles-set-of-4",
    name: "Stone Bangles — Set of 4",
    shortDescription: "Four coordinated bangles for layered styling.",
    description: "Four complementary bangles with mixed stonework.",
    categoryPaths: ["/jewellery/bangles", "/jewellery"],
    basePrice: 799,
    baseSalePrice: 549,
    attributes: { material_jewel: "Alloy", occasion: "Festive" },
    variants: [
      { skuSuffix: "24", optionValues: { Size: "2.4" }, stock: 12 },
      { skuSuffix: "26", optionValues: { Size: "2.6" }, stock: 18 },
      { skuSuffix: "28", optionValues: { Size: "2.8" }, stock: 10 },
    ],
  },
  {
    slug: "silver-anklet-pair",
    name: "Silver Anklet — Pair",
    shortDescription: "Classic silver-tone anklets with tiny ghungroos.",
    description: "Everyday pair of silver-tone anklets. Adjustable fit.",
    categoryPaths: ["/jewellery/anklets", "/jewellery"],
    basePrice: 449,
    baseSalePrice: 299,
    attributes: { material_jewel: "Oxidised" },
    variants: [{ skuSuffix: "001", optionValues: { Size: "Adjustable" }, stock: 20 }],
  },

  // ───────────── Clothing ─────────────
  {
    slug: "ivory-anarkali-kurti",
    name: "Ivory Anarkali Kurti",
    shortDescription: "Flowy ivory anarkali with gold-thread embroidery.",
    description: "A-line silhouette with intricate zari work on the yoke.",
    categoryPaths: ["/clothing/kurtis", "/clothing"],
    basePrice: 1899,
    baseSalePrice: 1299,
    isFeatured: true,
    attributes: { fabric: "Rayon", fit: "A-Line", sleeve: "Three-Quarter", occasion: "Festive" },
    variants: [
      { skuSuffix: "S", optionValues: { Size: "S" }, stock: 10 },
      { skuSuffix: "M", optionValues: { Size: "M" }, stock: 12 },
      { skuSuffix: "L", optionValues: { Size: "L" }, stock: 8 },
      { skuSuffix: "XL", optionValues: { Size: "XL" }, stock: 5 },
    ],
  },
  {
    slug: "banarasi-silk-saree",
    name: "Banarasi Silk Saree",
    shortDescription: "Traditional Banarasi weave with rich zari border.",
    description: "Pure feel silk-blend saree with handwoven motifs. Comes with an unstitched blouse piece.",
    categoryPaths: ["/clothing/sarees", "/clothing/ethnic-wear"],
    basePrice: 3499,
    baseSalePrice: 2499,
    isFeatured: true,
    isNewArrival: true,
    attributes: { fabric: "Silk", occasion: "Wedding" },
    variants: [{ skuSuffix: "001", optionValues: { Color: "Maroon" }, stock: 6 }],
  },
  {
    slug: "floral-georgette-dress",
    name: "Floral Georgette Dress",
    shortDescription: "Breezy knee-length georgette dress with a floral print.",
    description: "Lightweight georgette with lining. Perfect for brunches and casual outings.",
    categoryPaths: ["/clothing/dresses", "/clothing/western-wear"],
    basePrice: 1499,
    baseSalePrice: 999,
    isNewArrival: true,
    attributes: { fabric: "Georgette", fit: "A-Line", sleeve: "Short Sleeve", occasion: "Casual" },
    variants: [
      { skuSuffix: "S", optionValues: { Size: "S" }, stock: 7 },
      { skuSuffix: "M", optionValues: { Size: "M" }, stock: 11 },
      { skuSuffix: "L", optionValues: { Size: "L" }, stock: 9 },
    ],
  },
  {
    slug: "cotton-kurta-set",
    name: "Cotton Kurta Set",
    shortDescription: "Breathable 3-piece kurta set for daily comfort.",
    description: "Includes kurta, pants and a mulmul dupatta.",
    categoryPaths: ["/clothing/kurta-sets", "/clothing/ethnic-wear"],
    basePrice: 1999,
    baseSalePrice: 1399,
    attributes: { fabric: "Cotton", fit: "Regular", sleeve: "Three-Quarter", occasion: "Casual" },
    variants: [
      { skuSuffix: "S", optionValues: { Size: "S" }, stock: 6 },
      { skuSuffix: "M", optionValues: { Size: "M" }, stock: 9 },
      { skuSuffix: "L", optionValues: { Size: "L" }, stock: 7 },
      { skuSuffix: "XL", optionValues: { Size: "XL" }, stock: 4 },
    ],
  },
  {
    slug: "mirror-lehenga",
    name: "Mirror-Work Lehenga",
    shortDescription: "Statement mirror-work lehenga for the big day.",
    description: "Hand-stitched mirror embellishments. Includes choli and dupatta.",
    categoryPaths: ["/clothing/lehengas", "/clothing/ethnic-wear"],
    basePrice: 7999,
    baseSalePrice: 5499,
    isFeatured: true,
    attributes: { fabric: "Georgette", occasion: "Wedding" },
    variants: [
      { skuSuffix: "S", optionValues: { Size: "S" }, stock: 2 },
      { skuSuffix: "M", optionValues: { Size: "M" }, stock: 3 },
      { skuSuffix: "L", optionValues: { Size: "L" }, stock: 2 },
    ],
  },
  {
    slug: "linen-crop-top",
    name: "Linen Crop Top",
    shortDescription: "Breathable linen crop top in muted tones.",
    description: "Minimal, versatile and endlessly layerable.",
    categoryPaths: ["/clothing/tops", "/clothing/western-wear"],
    basePrice: 899,
    attributes: { fabric: "Linen", fit: "Regular", sleeve: "Sleeveless", occasion: "Casual" },
    variants: [
      { skuSuffix: "S", optionValues: { Size: "S" }, stock: 10 },
      { skuSuffix: "M", optionValues: { Size: "M" }, stock: 14 },
      { skuSuffix: "L", optionValues: { Size: "L" }, stock: 8 },
    ],
  },
  {
    slug: "coord-set-rust",
    name: "Rust Co-ord Set",
    shortDescription: "Matching shirt and trouser in warm rust.",
    description: "Relaxed fit co-ord set, perfect for the office or weekend.",
    categoryPaths: ["/clothing/co-ord-sets", "/clothing/western-wear"],
    basePrice: 2499,
    baseSalePrice: 1799,
    isNewArrival: true,
    attributes: { fabric: "Cotton", fit: "Regular", occasion: "Office" },
    variants: [
      { skuSuffix: "S", optionValues: { Size: "S" }, stock: 5 },
      { skuSuffix: "M", optionValues: { Size: "M" }, stock: 7 },
      { skuSuffix: "L", optionValues: { Size: "L" }, stock: 6 },
    ],
  },

  // ───────────── Bags ─────────────
  {
    slug: "pearl-embellished-clutch",
    name: "Pearl Embellished Clutch",
    shortDescription: "Hand-beaded clutch for evening occasions.",
    description: "Satin shell with hand-beaded pearls. Includes a detachable chain strap.",
    categoryPaths: ["/bags/clutches", "/bags/party-bags"],
    basePrice: 1299,
    baseSalePrice: 899,
    isFeatured: true,
    attributes: { bag_type: "Clutch", bag_material: "Beaded" },
    variants: [{ skuSuffix: "IVY", optionValues: { Color: "Ivory" }, stock: 11 }],
  },
  {
    slug: "canvas-tote-bag",
    name: "Canvas Tote Bag",
    shortDescription: "Everyday canvas tote with gold-tone hardware.",
    description: "Spacious with an inner zip pocket. Carries all your essentials.",
    categoryPaths: ["/bags/tote-bags"],
    basePrice: 899,
    baseSalePrice: 649,
    attributes: { bag_type: "Tote", bag_material: "Canvas" },
    variants: [
      { skuSuffix: "BEI", optionValues: { Color: "Beige" }, stock: 20 },
      { skuSuffix: "BLK", optionValues: { Color: "Black" }, stock: 18 },
    ],
  },
  {
    slug: "sling-bag-tan",
    name: "Tan Crossbody Sling",
    shortDescription: "Compact crossbody sling in warm tan PU.",
    description: "Adjustable strap with gold-tone chain accent.",
    categoryPaths: ["/bags/sling-bags"],
    basePrice: 1099,
    baseSalePrice: 749,
    isNewArrival: true,
    attributes: { bag_type: "Sling", bag_material: "PU Leather" },
    variants: [{ skuSuffix: "TAN", optionValues: { Color: "Tan" }, stock: 14 }],
  },
  {
    slug: "structured-handbag",
    name: "Structured Handbag",
    shortDescription: "Clean lines, timeless silhouette, everyday hero.",
    description: "A workhorse handbag with structured sides and polished hardware.",
    categoryPaths: ["/bags/handbags"],
    basePrice: 1899,
    baseSalePrice: 1399,
    isFeatured: true,
    attributes: { bag_type: "Handbag", bag_material: "PU Leather" },
    variants: [
      { skuSuffix: "BLK", optionValues: { Color: "Black" }, stock: 9 },
      { skuSuffix: "BRN", optionValues: { Color: "Brown" }, stock: 8 },
    ],
  },
  {
    slug: "mini-wallet",
    name: "Mini Card Wallet",
    shortDescription: "Compact card holder in soft PU.",
    description: "6 card slots, 1 cash pocket. Fits every pocket.",
    categoryPaths: ["/bags/wallets"],
    basePrice: 499,
    attributes: { bag_type: "Wallet", bag_material: "PU Leather" },
    variants: [{ skuSuffix: "BLK", optionValues: { Color: "Black" }, stock: 30 }],
  },

  // ───────────── Accessories ─────────────
  {
    slug: "cat-eye-sunglasses",
    name: "Cat-Eye Sunglasses",
    shortDescription: "Statement cat-eye frames with UV protection.",
    description: "Lightweight acetate frames with polarised lenses.",
    categoryPaths: ["/accessories/sunglasses"],
    basePrice: 1299,
    baseSalePrice: 899,
    attributes: { occasion: "Party" },
    variants: [
      { skuSuffix: "BLK", optionValues: { Color: "Black" }, stock: 12 },
      { skuSuffix: "BRN", optionValues: { Color: "Brown" }, stock: 10 },
    ],
  },
  {
    slug: "pearl-hair-clips",
    name: "Pearl Hair Clips — Pack of 3",
    shortDescription: "Minimal pearl-studded hair clips.",
    description: "Three coordinated clips for layered hair styling.",
    categoryPaths: ["/accessories/hair-accessories"],
    basePrice: 299,
    baseSalePrice: 199,
    isNewArrival: true,
    attributes: { occasion: "Casual" },
    variants: [{ skuSuffix: "001", optionValues: { Color: "Ivory" }, stock: 40 }],
  },
  {
    slug: "silk-scarf",
    name: "Printed Silk Scarf",
    shortDescription: "Lightweight silk-blend scarf with a block print.",
    description: "A versatile accessory — wear as a scarf, headband or bag tie.",
    categoryPaths: ["/accessories/scarves"],
    basePrice: 599,
    attributes: { fabric: "Silk", occasion: "Casual" },
    variants: [{ skuSuffix: "001", optionValues: { Color: "Teal" }, stock: 15 }],
  },

  // ───────────── Footwear ─────────────
  {
    slug: "block-heel-sandals",
    name: "Block Heel Sandals",
    shortDescription: "Comfortable block heels for day-to-dinner.",
    description: "Padded footbed with a 2-inch block heel. Easy to walk in.",
    categoryPaths: ["/footwear/heels", "/footwear/sandals"],
    basePrice: 1799,
    baseSalePrice: 1299,
    isFeatured: true,
    attributes: { heel_height: 5, occasion: "Party" },
    variants: [
      { skuSuffix: "5", optionValues: { Size: "5" }, stock: 4 },
      { skuSuffix: "6", optionValues: { Size: "6" }, stock: 6 },
      { skuSuffix: "7", optionValues: { Size: "7" }, stock: 5 },
      { skuSuffix: "8", optionValues: { Size: "8" }, stock: 3 },
    ],
  },
  {
    slug: "embroidered-juttis",
    name: "Embroidered Juttis",
    shortDescription: "Hand-embroidered juttis in ivory and gold.",
    description: "Traditional silhouette with intricate thread work.",
    categoryPaths: ["/footwear/juttis"],
    basePrice: 1299,
    baseSalePrice: 899,
    isNewArrival: true,
    attributes: { occasion: "Wedding" },
    variants: [
      { skuSuffix: "5", optionValues: { Size: "5" }, stock: 3 },
      { skuSuffix: "6", optionValues: { Size: "6" }, stock: 5 },
      { skuSuffix: "7", optionValues: { Size: "7" }, stock: 4 },
      { skuSuffix: "8", optionValues: { Size: "8" }, stock: 2 },
    ],
  },
  {
    slug: "casual-slip-ons",
    name: "Casual Slip-Ons",
    shortDescription: "Minimal everyday slip-ons.",
    description: "Soft cushioned sole, breathable upper. Great for daily wear.",
    categoryPaths: ["/footwear/casual-shoes", "/footwear/flats"],
    basePrice: 999,
    baseSalePrice: 699,
    attributes: { occasion: "Casual" },
    variants: [
      { skuSuffix: "5", optionValues: { Size: "5" }, stock: 5 },
      { skuSuffix: "6", optionValues: { Size: "6" }, stock: 8 },
      { skuSuffix: "7", optionValues: { Size: "7" }, stock: 6 },
      { skuSuffix: "8", optionValues: { Size: "8" }, stock: 4 },
    ],
  },
];

async function main() {
  console.log(`▸ seeding ${PRODUCTS.length} DEMO products…`);

  // Preload category ids by path (so we can skip products that reference missing paths cleanly)
  const paths = Array.from(new Set(PRODUCTS.flatMap((p) => p.categoryPaths)));
  const cats = await prisma.category.findMany({ where: { path: { in: paths } }, select: { id: true, path: true } });
  const catByPath = new Map(cats.map((c) => [c.path, c.id]));

  // Preload attribute definitions
  const attrDefs = await prisma.attributeDefinition.findMany();
  const attrByCode = new Map(attrDefs.map((a) => [a.code, a]));

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const p of PRODUCTS) {
    const primary = catByPath.get(p.categoryPaths[0]);
    if (!primary) {
      console.warn(`  ! skipping ${p.slug} — unknown category ${p.categoryPaths[0]}`);
      skipped++;
      continue;
    }

    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    const data = {
      name: `${p.name}`,
      shortDescription: p.shortDescription,
      description: p.description,
      brand: "BRENSTA",
      basePrice: p.basePrice,
      baseSalePrice: p.baseSalePrice ?? null,
      status: PublishStatus.PUBLISHED,
      isFeatured: !!p.isFeatured,
      isNewArrival: !!p.isNewArrival,
      publishedAt: new Date(),
      seoTitle: `${p.name} | BRENSTA`,
      seoDescription: p.shortDescription,
      taxRatePct: 5,
    };
    const product = existing
      ? await prisma.product.update({ where: { slug: p.slug }, data })
      : await prisma.product.create({ data: { slug: p.slug, ...data } });

    if (existing) updated++;
    else created++;

    // Categories
    await prisma.productCategory.deleteMany({ where: { productId: product.id } });
    for (let i = 0; i < p.categoryPaths.length; i++) {
      const cid = catByPath.get(p.categoryPaths[i]);
      if (!cid) continue;
      await prisma.productCategory.create({
        data: { productId: product.id, categoryId: cid, isPrimary: i === 0 },
      });
    }

    // Attribute values
    if (p.attributes) {
      await prisma.productAttributeValue.deleteMany({ where: { productId: product.id } });
      for (const [code, val] of Object.entries(p.attributes)) {
        const def = attrByCode.get(code);
        if (!def) continue;
        const row: {
          productId: string;
          attributeId: string;
          valueText?: string;
          valueNumber?: number;
          valueBool?: boolean;
          valueOption?: string;
        } = { productId: product.id, attributeId: def.id };
        if (def.type === "NUMBER") row.valueNumber = Number(val);
        else if (def.type === "BOOL") row.valueBool = Boolean(val);
        else if (def.type === "ENUM" || def.type === "COLOR") row.valueOption = String(val);
        else row.valueText = String(val);
        await prisma.productAttributeValue.create({ data: row });
      }
    }

    // Variants — replace fully (idempotent re-seed)
    await prisma.productVariant.deleteMany({ where: { productId: product.id } });
    for (const v of p.variants) {
      const sku = `DEMO-${p.slug.toUpperCase().replace(/-/g, "").slice(0, 10)}-${v.skuSuffix}`;
      const variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku,
          price: v.price ?? p.basePrice,
          salePrice: v.salePrice ?? p.baseSalePrice ?? null,
          stock: v.stock,
          lowStockThreshold: 3,
          optionValues: v.optionValues,
          isActive: true,
        },
      });
      await prisma.stockLedger.create({
        data: { variantId: variant.id, delta: v.stock, reason: "initial", note: "DEMO seed" },
      });
    }

    // Images — placeholder scheme the ProductCard knows how to render
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.createMany({
      data: [
        { productId: product.id, url: `placeholder:${p.slug}:1`, alt: p.name, sortOrder: 0, isPrimary: true },
        { productId: product.id, url: `placeholder:${p.slug}:2`, alt: `${p.name} — alternate view`, sortOrder: 1, isPrimary: false },
      ],
    });
  }

  console.log(`✓ products: created=${created} updated=${updated} skipped=${skipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
