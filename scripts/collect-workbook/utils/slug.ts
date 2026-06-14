export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

export function suggestWorkbookId(title: string): string {
  const slug = toSlug(title)
    .replace(/고등/g, "")
    .replace(/202[0-9]/g, "")
    .replace(/년용/g, "")
    .replace(/^-+|-+$/g, "");

  const compact = slug.slice(0, 32) || "new-workbook";
  return `wb-${compact}`;
}
