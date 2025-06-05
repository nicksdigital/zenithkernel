// SSR JSX runtime for ZenithKernel
import { VirtualNode, Fragment } from './jsx-ssr-virtual-runtime';

const VOID_ELEMENTS = new Set([
  "area","base","br","col","embed","hr","img","input","link","meta","param","source","track","wbr"
]);

function escapeHtml(str: string): string {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c] || ''));
}

export function renderToString(element: any, context: any = {}): string {
  if (element == null || typeof element === "boolean") return "";
  if (typeof element === "string" || typeof element === "number") {
    return escapeHtml(String(element));
  }
  if (Array.isArray(element)) {
    return element.map(child => renderToString(child, context)).join("");
  }
  if (typeof element === "object" && element !== null && 'type' in element && 'props' in element) {
    const { type, props } = element as VirtualNode;
    if (type === Fragment) {
      return renderToString(props.children, context);
    }
    if (typeof type === "function") {
      return renderToString(type({ ...props, context }), context);
    }
    let html = `<${type}`;
    for (const [key, value] of Object.entries(props)) {
      if (key === "children" || value == null) continue;
      if (key === "className") {
        html += ` class="${escapeHtml(String(value))}"`;
      } else if (key.startsWith("on")) {
        continue;
      } else if (typeof value === "boolean") {
        if (value) html += ` ${key}`;
        // skip if false
      } else {
        html += ` ${key}="${escapeHtml(String(value))}"`;
      }
    }
    if (VOID_ELEMENTS.has(type)) {
      html += " />";
      return html;
    }
    html += ">";
    if (props.dangerouslySetInnerHTML && props.dangerouslySetInnerHTML.__html) {
      html += props.dangerouslySetInnerHTML.__html;
    } else {
      html += renderToString(props.children, context);
    }
    html += `</${type}>`;
    return html;
  }
  return "";
}