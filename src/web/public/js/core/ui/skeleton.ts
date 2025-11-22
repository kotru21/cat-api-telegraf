// Reusable skeleton utilities for tables and blocks

interface MountTableSkeletonOptions {
  tableBody: HTMLElement;
  template: HTMLTemplateElement;
  count?: number;
}

export function mountTableSkeleton({
  tableBody,
  template,
  count = 5,
}: MountTableSkeletonOptions) {
  if (!tableBody || !template) return () => {};
  tableBody.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const clone = document.importNode(template.content, true);
    // accessibility — hide from AT
    Array.from(clone.querySelectorAll("*")).forEach((el) =>
      el.setAttribute("aria-hidden", "true")
    );
    tableBody.appendChild(clone);
  }
  return () => (tableBody.innerHTML = "");
}

interface RenderFallbackRowOptions {
  text: string;
  colspan?: number;
  classes?: string;
}

export function renderFallbackRow(
  tableBody: HTMLElement,
  { text, colspan = 4, classes = "" }: RenderFallbackRowOptions
) {
  if (!tableBody) return;
  tableBody.innerHTML = `<tr><td colspan="${colspan}" class="${classes} text-center py-8 text-gray-400">${text}</td></tr>`;
}

export default { mountTableSkeleton, renderFallbackRow };
