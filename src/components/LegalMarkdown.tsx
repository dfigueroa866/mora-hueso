import type { ReactNode } from "react";

function linkify(text: string): ReactNode[] {
  const parts = text.split(/(hola@morahueso\.com|\/legal\/[a-z-]+)/g);
  return parts.map((part, i) => {
    if (part === "hola@morahueso.com") {
      return (
        <a
          key={i}
          href="mailto:hola@morahueso.com"
          className="text-berry hover:underline"
        >
          {part}
        </a>
      );
    }
    if (part.startsWith("/legal/")) {
      return (
        <a key={i} href={part} className="text-berry hover:underline">
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/** Renderiza Markdown simple: párrafos, ## títulos y listas con -. */
export function LegalMarkdown({ content }: { content: string }) {
  const blocks = content
    .trim()
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <>
      {blocks.map((block, idx) => {
        if (block.startsWith("## ")) {
          const title = block.replace(/^##\s+/, "").trim();
          const rest = block.split("\n").slice(1).join("\n").trim();
          return (
            <section key={idx}>
              <h2 className="font-display text-2xl font-semibold text-ink">
                {title}
              </h2>
              {rest ? (
                <div className="mt-3 space-y-3">
                  <LegalMarkdown content={rest} />
                </div>
              ) : null}
            </section>
          );
        }

        const lines = block.split("\n").map((l) => l.trim());
        const isList = lines.every((l) => l.startsWith("- ") || l === "");
        if (isList) {
          return (
            <ul key={idx} className="list-disc space-y-1 pl-5">
              {lines
                .filter((l) => l.startsWith("- "))
                .map((l, i) => (
                  <li key={i}>{linkify(l.slice(2))}</li>
                ))}
            </ul>
          );
        }

        return <p key={idx}>{linkify(block.replace(/\n/g, " "))}</p>;
      })}
    </>
  );
}
