// js/core/utils.js
// ------------------------------------------------------------
// Generic utilities + caches + DOM helpers
// ------------------------------------------------------------

// ---- DOM factory ------------------------------------------------
// Enhanced element creator with support for attributes, events, dataset, and styles.
// Example:
// const btn = el('button', {
//   class: 'my-btn',
//   on: { click: handleClick, mouseenter: highlight },
//   dataset: { action: 'save' },
//   style: { inlineSize: '100%' }
// }, 'Save');

export function el(tag, attrs = {}, ...children) {
	const node = document.createElement(tag);

	// Extract special props so they don't go through setAttribute.
	const { on, dataset, style, ...rest } = attrs || {};

	// --- Regular attributes ---
	for (const [k, v] of Object.entries(rest)) {
		if (k === 'class') node.className = v ?? '';
		else if (k === 'html') node.innerHTML = v ?? '';
		else if (typeof v === 'boolean') {
			if (v) node.setAttribute(k, '');
		} else if (v != null) {
			node.setAttribute(k, v);
		}
	}

	// --- Dataset (data-*) ---
	if (dataset && typeof dataset === 'object') {
		for (const [key, val] of Object.entries(dataset)) {
			if (val != null) node.dataset[key] = String(val);
		}
	}

	// --- Inline styles ---
	if (style && typeof style === 'object') {
		for (const [key, val] of Object.entries(style)) {
			if (val != null) node.style[key] = val;
		}
	}

	// --- Event listeners (attrs.on = { click: fn, input: fn }) ---
	if (on && typeof on === 'object') {
		for (const [event, handler] of Object.entries(on)) {
			if (typeof handler === 'function') {
				node.addEventListener(event, handler);
			}
		}
	}

	// --- Append children ---
	for (const child of children) {
		if (child == null) continue;
		node.append(child.nodeType ? child : document.createTextNode(String(child)));
	}

	return node;
}


// ---- Stylesheet & HTML caches ----------------------------------
const _cssCache = new Map();   // href -> HTMLLinkElement
const _fontCache = new Set();  // href
const _htmlCache = new Map();

export function injectCSS(href, attrs = {}) {
  if (!href) return null;

  // Fonts are injected once and never removed
  if (attrs.kind === 'font') {
    if (_fontCache.has(href)) return null;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'kind') { link.dataset.asset = 'font'; continue; }
      link.setAttribute(k, v);
    }
    document.head.appendChild(link);
    _fontCache.add(href);
    return link;
  }

  // Template/other CSS (removable)
  if (_cssCache.has(href)) return _cssCache.get(href);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'kind') { link.dataset.asset = 'css'; continue; }
    link.setAttribute(k, v);
  }
  document.head.appendChild(link);
  _cssCache.set(href, link);
  return link;
}

export function removeCSS(href) {
  const link = _cssCache.get(href);
  if (link && link.parentNode) link.parentNode.removeChild(link);
  _cssCache.delete(href);
}

export async function getHTML(url) {
  if (!url) throw new Error('[utils] getHTML: missing URL');
  if (_htmlCache.has(url)) return _htmlCache.get(url);
  const html = await fetch(url).then(r => r.text());
  const clean = html.trim();
  _htmlCache.set(url, clean);
  return clean;
}

// Debug helpers (optional)
export function _clearCaches() {
  _cssCache.clear();
  _fontCache.clear();
  _htmlCache.clear();
}
export function _debugCaches() {
  return {
    css: Array.from(_cssCache.keys()),
    fonts: Array.from(_fontCache.values()),
    html: Array.from(_htmlCache.keys())
  };
}





/* schema */
export function schemaData( schema = [] ) {

	const initialValues = schema.reduce( ( acc, field ) => {

		if(!field || !field.name || field.initial === undefined ) return acc;

		acc[ field.name ] = field.initial;

		return acc;

	}, {});

	return { schema, initialValues }

}