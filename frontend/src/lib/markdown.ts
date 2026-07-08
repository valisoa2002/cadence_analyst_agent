/**
 * Rendu markdown volontairement minimal — l'agent (backend Python)
 * renvoie du texte avec **gras** et des puces "- ", pas du markdown
 * complexe. Pas besoin d'une librairie complète pour ça.
 */
export function renderMinimalMarkdown(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const withBold = escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  const lines = withBold.split("\n");
  const htmlLines: string[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ")) {
      if (!inList) {
        htmlLines.push("<ul class='list-disc pl-5 my-1'>");
        inList = true;
      }
      htmlLines.push(`<li>${trimmed.slice(2)}</li>`);
    } else {
      if (inList) {
        htmlLines.push("</ul>");
        inList = false;
      }
      if (trimmed.length > 0) {
        htmlLines.push(`<p class="mb-1 last:mb-0">${trimmed}</p>`);
      }
    }
  }
  if (inList) htmlLines.push("</ul>");

  return htmlLines.join("");
}
