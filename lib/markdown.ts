/**
 * Minimal, dependency-free markdown → HTML for policy pages.
 * Handles: headings (# ## ###), paragraphs, bold, italic, inline code, links,
 * ordered + unordered lists, blockquotes and tables (pipe form).
 * It escapes HTML inside the input so admin content can never inject markup.
 */
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function inlineMd(s: string): string {
  // Escape raw first
  let out = esc(s);
  // Inline code
  out = out.replace(/`([^`]+)`/g, (_, c) => `<code class="rounded bg-ivory px-1 py-0.5 font-mono text-[0.9em]">${c}</code>`);
  // Links [label](href)
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
    const safe = /^https?:\/\/|^\//.test(href) ? href : "#";
    const external = /^https?:/.test(safe);
    return `<a href="${safe}" ${external ? 'target="_blank" rel="noopener noreferrer"' : ""} class="text-gold-deep underline underline-offset-4 hover:text-charcoal">${label}</a>`;
  });
  // Bold **x**
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  // Italic *x* or _x_
  out = out.replace(/(^|\s)\*([^*]+)\*/g, "$1<em>$2</em>");
  out = out.replace(/(^|\s)_([^_]+)_/g, "$1<em>$2</em>");
  return out;
}

export function renderPolicyMarkdown(md: string): string {
  const lines = md.split("\n");
  const html: string[] = [];
  let i = 0;

  const flushList = (type: "ol" | "ul", items: string[]) => {
    html.push(`<${type} class="my-3 space-y-1 pl-6 ${type === "ol" ? "list-decimal" : "list-disc"}">`);
    for (const it of items) html.push(`<li class="text-charcoal/80">${inlineMd(it)}</li>`);
    html.push(`</${type}>`);
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (/^###\s+/.test(trimmed)) {
      html.push(`<h3 class="mt-6 brand-wordmark text-lg text-charcoal">${inlineMd(trimmed.replace(/^###\s+/, ""))}</h3>`);
      i++;
      continue;
    }
    if (/^##\s+/.test(trimmed)) {
      html.push(`<h2 class="mt-8 brand-wordmark text-xl text-charcoal">${inlineMd(trimmed.replace(/^##\s+/, ""))}</h2>`);
      i++;
      continue;
    }
    if (/^#\s+/.test(trimmed)) {
      html.push(`<h1 class="brand-wordmark text-2xl text-charcoal md:text-3xl">${inlineMd(trimmed.replace(/^#\s+/, ""))}</h1>`);
      i++;
      continue;
    }
    if (/^>\s+/.test(trimmed)) {
      html.push(`<blockquote class="my-3 border-l-2 border-gold pl-3 text-sm text-brand-muted">${inlineMd(trimmed.replace(/^>\s+/, ""))}</blockquote>`);
      i++;
      continue;
    }
    // Table (pipe form) — detect header row + separator
    if (/^\|.+\|$/.test(trimmed) && i + 1 < lines.length && /^\|[\s-:|]+\|$/.test(lines[i + 1].trim())) {
      const header = trimmed.split("|").slice(1, -1).map((c) => c.trim());
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && /^\|.+\|$/.test(lines[i].trim())) {
        rows.push(lines[i].trim().split("|").slice(1, -1).map((c) => c.trim()));
        i++;
      }
      html.push(`<div class="my-4 overflow-x-auto rounded-lg border border-brand-line"><table class="min-w-full divide-y divide-brand-line text-sm">`);
      html.push(`<thead class="bg-ivory text-left"><tr>${header.map((h) => `<th class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-brand-muted">${inlineMd(h)}</th>`).join("")}</tr></thead>`);
      html.push(`<tbody class="divide-y divide-brand-line">${rows.map((r) => `<tr>${r.map((c) => `<td class="px-3 py-2 text-charcoal/80">${inlineMd(c)}</td>`).join("")}</tr>`).join("")}</tbody>`);
      html.push(`</table></div>`);
      continue;
    }
    const olMatch = /^(\d+)\.\s+(.*)/.exec(trimmed);
    if (olMatch) {
      const items: string[] = [];
      while (i < lines.length) {
        const m = /^(\d+)\.\s+(.*)/.exec(lines[i].trim());
        if (!m) break;
        items.push(m[2]);
        i++;
      }
      flushList("ol", items);
      continue;
    }
    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i++;
      }
      flushList("ul", items);
      continue;
    }
    if (trimmed === "") {
      i++;
      continue;
    }
    // Paragraph (collect contiguous non-blank lines)
    const para: string[] = [trimmed];
    i++;
    while (i < lines.length && lines[i].trim() !== "" && !/^(#{1,3}\s|[-*]\s|\d+\.\s|\|.+\|$|>\s)/.test(lines[i].trim())) {
      para.push(lines[i].trim());
      i++;
    }
    html.push(`<p class="my-3 text-sm leading-relaxed text-charcoal/80">${inlineMd(para.join(" "))}</p>`);
  }

  return html.join("\n");
}
