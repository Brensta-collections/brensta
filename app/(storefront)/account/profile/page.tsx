import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";
import { ProfileForm } from "./ProfileForm";

export default async function ProfilePage() {
  const user = await requireUser();
  const row = await prisma.user.findUnique({ where: { id: user.id }, select: { name: true, email: true, phone: true } });
  return (
    <section className="rounded-xl border border-brand-line bg-white p-6">
      <h2 className="brand-wordmark text-xl text-charcoal">My Profile</h2>
      <p className="mt-1 text-sm text-brand-muted">Update your name and contact mobile. Your email is your sign-in identifier.</p>
      <div className="mt-6">
        <ProfileForm name={row?.name ?? ""} email={row?.email ?? ""} phone={row?.phone ?? ""} />
      </div>
    </section>
  );
}
