import { prisma } from "@/lib/db";

export async function getAdminStats() {
  const now = new Date();
  const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [orderCount, revenueAgg, productCount, draftCount, customerCount, lowStock, recentOrders, pendingReviews] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { total: true }, where: { status: { in: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] } } }),
    prisma.product.count({ where: { status: "PUBLISHED" } }),
    prisma.product.count({ where: { status: "DRAFT" } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.productVariant.findMany({
      where: { isActive: true, stock: { lte: 5 } },
      select: { id: true, sku: true, stock: true, product: { select: { name: true, slug: true } } },
      orderBy: { stock: "asc" },
      take: 8,
    }),
    prisma.order.findMany({
      orderBy: { placedAt: "desc" },
      take: 8,
      select: {
        id: true, number: true, status: true, total: true, placedAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.review.count({ where: { status: "PENDING" } }),
  ]);

  const last30Orders = await prisma.order.count({ where: { placedAt: { gte: past30 } } });
  const last30Revenue = await prisma.order.aggregate({
    _sum: { total: true },
    where: { placedAt: { gte: past30 }, status: { in: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] } },
  });

  return {
    orderCount,
    revenue: Number(revenueAgg._sum.total ?? 0),
    productCount,
    draftCount,
    customerCount,
    lowStock,
    recentOrders,
    pendingReviews,
    last30Orders,
    last30Revenue: Number(last30Revenue._sum.total ?? 0),
  };
}
