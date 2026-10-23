import { prisma } from "@/lib/db";
import { whatsAppUrlFromSetting, WHATSAPP_GREETING } from "@/lib/whatsapp";

/**
 * Floating WhatsApp quick-contact button, rendered on every storefront
 * page by the storefront layout. Server component — reads the owner-
 * published `contact.whatsapp` Setting on each render, so the admin can
 * publish or revoke the number from /admin/settings without a redeploy.
 *
 * Renders NOTHING when the Setting is a placeholder, missing, or doesn't
 * normalise to a usable international number.
 */
export async function WhatsAppFab() {
  const row = await prisma.setting.findUnique({ where: { key: "contact.whatsapp" } });
  const raw = typeof row?.value === "string" ? row.value : null;
  const url = whatsAppUrlFromSetting(raw, WHATSAPP_GREETING);
  if (!url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with BRENSTA on WhatsApp"
      className="fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-charcoal/25 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#25D366] md:bottom-6 md:right-6"
    >
      {/* Inline SVG mark — generic chat-icon with WhatsApp-recognisable
          curve. Marked aria-hidden; the <a> itself carries the a11y name. */}
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-7 w-7"
        fill="currentColor"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.1-.471-.149-.67.149-.198.297-.767.967-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.019-.458.13-.606.134-.133.298-.347.446-.52.149-.173.198-.297.297-.496.1-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.372-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 22.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26C2.17 6.661 6.604 2.228 12.056 2.228a9.825 9.825 0 0 1 6.988 2.898 9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884M20.463 3.488A11.815 11.815 0 0 0 12.05.102C5.495.102.16 5.437.157 11.995c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
      </svg>
    </a>
  );
}
