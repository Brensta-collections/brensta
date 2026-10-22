import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/admin");
  if (session.user.role !== "ADMIN" && session.user.role !== "STAFF") {
    redirect("/");
  }
  return session.user;
}

export async function requireStrictAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/admin");
  if (session.user.role !== "ADMIN") redirect("/admin");
  return session.user;
}

export async function assertAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  if (session.user.role !== "ADMIN" && session.user.role !== "STAFF") {
    throw new Error("FORBIDDEN");
  }
  return session.user;
}
