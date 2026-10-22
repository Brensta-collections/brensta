/**
 * BRENSTA seed data.
 * Everything inserted here is clearly labelled DEMO so it is never mistaken for real data.
 * Idempotent: safe to re-run.
 */
import { PrismaClient, PublishStatus, AttributeType } from "@prisma/client";

const prisma = new PrismaClient();

type CatSeed = { name: string; children?: CatSeed[] };

const CATEGORY_TREE: CatSeed[] = [
  {
    name: "Jewellery",
    children: [
      { name: "Bangles" },
      { name: "Jhumkas" },
      { name: "Earrings" },
      { name: "Necklaces" },
      { name: "Bracelets" },
      { name: "Rings" },
      { name: "Anklets" },
      { name: "Mangalsutras" },
      { name: "Jewellery Sets" },
      { name: "Pendants" },
      { name: "Maang Tikka" },
    ],
  },
  {
    name: "Clothing",
    children: [
      { name: "Sarees" },
      { name: "Dresses" },
      { name: "Kurtis" },
      { name: "Kurta Sets" },
      { name: "Suits" },
      { name: "Lehengas" },
      { name: "Tops" },
      { name: "Co-ord Sets" },
      { name: "Jeans" },
      { name: "Skirts" },
      { name: "Ethnic Wear" },
      { name: "Western Wear" },
    ],
  },
  {
    name: "Bags",
    children: [
      { name: "Handbags" },
      { name: "Sling Bags" },
      { name: "Tote Bags" },
      { name: "Shoulder Bags" },
      { name: "Clutches" },
      { name: "Wallets" },
      { name: "Backpacks" },
      { name: "Party Bags" },
    ],
  },
  {
    name: "Accessories",
    children: [
      { name: "Sunglasses" },
      { name: "Hair Accessories" },
      { name: "Scarves" },
      { name: "Belts" },
      { name: "Watches" },
      { name: "Brooches" },
    ],
  },
  {
    name: "Footwear",
    children: [
      { name: "Sandals" },
      { name: "Flats" },
      { name: "Heels" },
      { name: "Juttis" },
      { name: "Casual Shoes" },
    ],
  },
];

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function upsertCategoryTree(nodes: CatSeed[], parentId: string | null, parentPath: string, depth: number, sortBase: number) {
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    const slug = slugify(n.name);
    const path = `${parentPath}/${slug}`;
    const existing = await prisma.category.findUnique({ where: { path } });
    const cat = existing
      ? await prisma.category.update({
          where: { path },
          data: {
            name: n.name,
            slug,
            parentId,
            depth,
            status: PublishStatus.PUBLISHED,
            sortOrder: sortBase + i,
          },
        })
      : await prisma.category.create({
          data: {
            name: n.name,
            slug,
            parentId,
            path,
            depth,
            status: PublishStatus.PUBLISHED,
            sortOrder: sortBase + i,
            showInMenu: true,
          },
        });
    if (n.children?.length) {
      await upsertCategoryTree(n.children, cat.id, path, depth + 1, 0);
    }
  }
}

async function upsertAttributes() {
  const defs: Array<{ code: string; name: string; type: AttributeType; options?: string[]; unit?: string }> = [
    { code: "size_clothing", name: "Size", type: "ENUM", options: ["XS", "S", "M", "L", "XL", "XXL"] },
    { code: "size_footwear", name: "Shoe Size (IND)", type: "ENUM", options: ["3", "4", "5", "6", "7", "8", "9"] },
    { code: "color", name: "Colour", type: "COLOR" },
    { code: "fabric", name: "Fabric", type: "ENUM", options: ["Cotton", "Silk", "Georgette", "Chiffon", "Linen", "Rayon", "Denim", "Net"] },
    { code: "fit", name: "Fit", type: "ENUM", options: ["Regular", "Slim", "Loose", "A-Line", "Bodycon"] },
    { code: "sleeve", name: "Sleeve", type: "ENUM", options: ["Sleeveless", "Short Sleeve", "Three-Quarter", "Full Sleeve"] },
    { code: "material_jewel", name: "Material", type: "ENUM", options: ["Alloy", "Brass", "Silver", "Gold Plated", "Oxidised", "Kundan", "Pearl", "Stone"] },
    { code: "plating", name: "Plating", type: "ENUM", options: ["Gold", "Silver", "Rose Gold", "Oxidised", "None"] },
    { code: "stone", name: "Stone", type: "ENUM", options: ["None", "Pearl", "Kundan", "Cubic Zirconia", "Semi-Precious"] },
    { code: "bag_type", name: "Bag Type", type: "ENUM", options: ["Handbag", "Sling", "Tote", "Clutch", "Wallet", "Backpack"] },
    { code: "bag_material", name: "Bag Material", type: "ENUM", options: ["PU Leather", "Canvas", "Fabric", "Jute", "Beaded"] },
    { code: "heel_height", name: "Heel Height (cm)", type: "NUMBER", unit: "cm" },
    { code: "occasion", name: "Occasion", type: "ENUM", options: ["Casual", "Party", "Festive", "Office", "Wedding"] },
    { code: "length_cm", name: "Length (cm)", type: "NUMBER", unit: "cm" },
    { code: "weight_g", name: "Weight (g)", type: "NUMBER", unit: "g" },
  ];

  for (const d of defs) {
    await prisma.attributeDefinition.upsert({
      where: { code: d.code },
      update: { name: d.name, type: d.type, options: d.options ?? undefined, unit: d.unit ?? undefined },
      create: { code: d.code, name: d.name, type: d.type, options: d.options ?? undefined, unit: d.unit ?? undefined },
    });
  }
}

async function wireCategoryAttributes() {
  // Simple mapping: top-level category → which attributes apply (inherit to children).
  const map: Record<string, string[]> = {
    jewellery: ["material_jewel", "plating", "stone", "color", "occasion", "length_cm", "weight_g"],
    clothing: ["size_clothing", "color", "fabric", "fit", "sleeve", "occasion"],
    bags: ["bag_type", "bag_material", "color"],
    accessories: ["color", "occasion"],
    footwear: ["size_footwear", "color", "heel_height", "occasion"],
  };

  for (const [catSlug, attrCodes] of Object.entries(map)) {
    const cat = await prisma.category.findUnique({ where: { path: `/${catSlug}` } });
    if (!cat) continue;
    for (let i = 0; i < attrCodes.length; i++) {
      const attr = await prisma.attributeDefinition.findUnique({ where: { code: attrCodes[i] } });
      if (!attr) continue;
      await prisma.categoryAttribute.upsert({
        where: { categoryId_attributeId: { categoryId: cat.id, attributeId: attr.id } },
        update: { isFilter: true, inheritToChildren: true, sortOrder: i },
        create: { categoryId: cat.id, attributeId: attr.id, isFilter: true, inheritToChildren: true, sortOrder: i },
      });
    }
  }
}

async function seedSettings() {
  const defaults: Array<{ key: string; value: unknown }> = [
    { key: "contact.email", value: "support@brensta.local" },
    { key: "contact.phone", value: "+91-00000-00000" },
    { key: "contact.whatsapp", value: "+91-00000-00000" },
    { key: "contact.address", value: "[PLACEHOLDER — add registered business address]" },
    { key: "contact.gstin", value: "[PLACEHOLDER]" },
    { key: "order.numberPrefix", value: "BRN" },
    { key: "shipping.freeThresholdInr", value: 999 },
    { key: "shipping.flatRateInr", value: 50 },
    { key: "shipping.codFeeInr", value: 40 },
    { key: "shipping.codEnabled", value: true },
    { key: "social.instagram", value: "" },
    { key: "social.facebook", value: "" },
  ];
  for (const s of defaults) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: { key: s.key, value: s.value as never },
    });
  }
}

async function seedPolicies() {
  const policies = [
    { slug: "privacy", title: "Privacy Policy" },
    { slug: "terms", title: "Terms & Conditions" },
    { slug: "shipping", title: "Shipping & Delivery Policy" },
    { slug: "returns", title: "Returns & Refunds Policy" },
    { slug: "cancellation", title: "Cancellation Policy" },
    { slug: "payment", title: "Payment Policy" },
    { slug: "grievance", title: "Contact & Grievance Redressal" },
    { slug: "faq", title: "Frequently Asked Questions" },
    { slug: "cookies", title: "Cookie Notice" },
  ];
  for (const p of policies) {
    await prisma.policy.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        title: p.title,
        bodyMarkdown: `# ${p.title}\n\n_[PLACEHOLDER — this policy is a draft. Please review with your legal advisor before publishing.]_\n`,
      },
    });
  }
}

async function main() {
  console.log("▸ seeding categories…");
  await upsertCategoryTree(CATEGORY_TREE, null, "", 0, 0);

  console.log("▸ seeding attribute definitions…");
  await upsertAttributes();

  console.log("▸ wiring category ↔ attribute mapping…");
  await wireCategoryAttributes();

  console.log("▸ seeding settings…");
  await seedSettings();

  console.log("▸ seeding policy drafts…");
  await seedPolicies();

  const counts = {
    categories: await prisma.category.count(),
    attributes: await prisma.attributeDefinition.count(),
    categoryAttributes: await prisma.categoryAttribute.count(),
    settings: await prisma.setting.count(),
    policies: await prisma.policy.count(),
  };
  console.log("✓ seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
