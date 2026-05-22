export function insertAtCursor(
  el: HTMLTextAreaElement | HTMLInputElement | null,
  text: string,
  current: string
): { next: string; cursor: number } {
  if (!el) {
    return { next: current + text, cursor: current.length + text.length };
  }
  const start = el.selectionStart ?? current.length;
  const end = el.selectionEnd ?? current.length;
  const next = current.slice(0, start) + text + current.slice(end);
  const cursor = start + text.length;
  return { next, cursor };
}
