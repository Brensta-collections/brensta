/**
 * Create the first admin user from BOOTSTRAP_ADMIN_* env vars.
 * Idempotent: if an admin with the same email exists, just prints info.
 */
import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const name = process.env.BOOTSTRAP_ADMIN_NAME ?? "BRENSTA Admin";

  if (!email || !password) {
    console.error("Missing BOOTSTRAP_ADMIN_EMAIL or BOOTSTRAP_ADMIN_PASSWORD in env.");
    process.exit(1);
  }
  if (password.length < 10) {
    console.error("Admin password must be at least 10 characters.");
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== UserRole.ADMIN) {
      await prisma.user.update({ where: { email }, data: { role: UserRole.ADMIN } });
      console.log(`✓ promoted existing user ${email} to ADMIN`);
    } else {
      console.log(`✓ admin ${email} already exists`);
    }
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { email, name, passwordHash, role: UserRole.ADMIN, isActive: true, emailVerified: new Date() },
  });
  console.log(`✓ created admin ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
