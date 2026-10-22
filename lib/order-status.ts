import type { OrderStatus } from "@prisma/client";

export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "RETURNED"],
  DELIVERED: ["RETURNED"],
  CANCELLED: [],
  RETURNED: ["REFUNDED"],
  REFUNDED: [],
};

/** Which order statuses the customer themselves may cancel (narrow by design). */
export const CUSTOMER_CANCELLABLE_STATUSES: ReadonlyArray<OrderStatus> = ["PENDING", "CONFIRMED"];

export function canCustomerCancel(status: string): boolean {
  return (CUSTOMER_CANCELLABLE_STATUSES as readonly string[]).includes(status);
}
