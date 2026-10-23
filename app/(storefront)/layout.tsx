import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppFab } from "@/components/layout/WhatsAppFab";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      {/* Owner-controlled: hides itself when contact.whatsapp is a placeholder. */}
      <WhatsAppFab />
      <Footer />
    </>
  );
}
