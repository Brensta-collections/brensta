/**
 * Server-rendered JSON-LD snippet. Call with a plain object; it is serialised and
 * escaped so no HTML can be injected via the data.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
