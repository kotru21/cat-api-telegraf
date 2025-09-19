// Reusable skeleton utilities for tables and blocks

export function mountTableSkeleton({ tableBody, template, count = 5 }) {
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

export function renderFallbackRow(
  tableBody,
  { text, colspan = 4, classes = "" }
) {
  if (!tableBody) return;
  tableBody.innerHTML = `<tr><td colspan="${colspan}" class="${classes} text-center py-8 text-gray-400">${text}</td></tr>`;
}

export default { mountTableSkeleton, renderFallbackRow };
