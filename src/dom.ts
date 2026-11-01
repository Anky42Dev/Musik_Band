type Child = Node | string | null | undefined | false;
type Attrs = Record<string, string | boolean | EventListener | undefined>;

/** Создаёт элемент без innerHTML: текст всегда вставляется как textContent. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === undefined || value === false) continue;
    if (typeof value === 'function') el.addEventListener(key.replace(/^on/, ''), value);
    else el.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children) {
    if (child) el.append(child);
  }
  return el;
}

export function field(
  label: string,
  control: HTMLElement,
  hint?: string,
): { wrap: HTMLElement; setError: (message: string | undefined) => void } {
  const error = h('p', { class: 'field-error', role: 'alert' });
  const wrap = h(
    'label',
    { class: 'field' },
    h('span', { class: 'field-label' }, label),
    control,
    hint ? h('span', { class: 'field-hint' }, hint) : null,
    error,
  );
  return { wrap, setError: (message) => (error.textContent = message ?? '') };
}
