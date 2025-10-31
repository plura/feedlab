// assets/js/templates/templateLoader.js
// ------------------------------------------------------------
// TemplateLoader — per-template asset IO + head side-effects
// - Resolves/fetches HTML (cached), extracts inline <style>
// - Injects template CSS (swap on apply) and inline styles (swap on apply)
// - Injects fonts once (never removed)
// - No knowledge of posts or bindings
// ------------------------------------------------------------

import { injectCSS, removeCSS, getHTML } from '../core/utils.js';

function extractInlineStyles(htmlString) {
	const div = document.createElement('div');
	div.innerHTML = htmlString;
	const styles = Array.from(div.querySelectorAll('style'));
	const cssTexts = styles.map(s => s.textContent || '');
	styles.forEach(s => s.remove());
	return { htmlWithoutStyles: div.innerHTML, styles: cssTexts };
}

function parseFirstElement(htmlString) {
	const div = document.createElement('div');
	div.innerHTML = htmlString;
	return div.firstElementChild || null;
}

export function createTemplateLoader() {
	// Caches
	const fontSet = new Set();                    // abs font hrefs injected
	const htmlCache = new Map();                  // htmlUrl -> { virtualRoot, inlineStyles }
	const cssHrefByTemplate = new Map();          // templateName -> abs css href
	const inlineStyleNodesByTemplate = new Map(); // templateName -> [<style>]

	function ensureFonts(tpl) {
		for (const href of tpl.fonts || []) {
			if (fontSet.has(href)) continue;
			injectCSS(href, { kind: 'font', 'data-template-font': tpl.name });
			fontSet.add(href);
		}
	}

	function ensureCSS(tpl) {
		if (!tpl.cssUrl) return;
		const current = cssHrefByTemplate.get(tpl.name);
		if (current === tpl.cssUrl) return; // already injected for this template
		injectCSS(tpl.cssUrl, {
			id: `tpl-css-${tpl.name}`,
			'data-asset': 'css',
			'data-template-css': tpl.name
		});
		cssHrefByTemplate.set(tpl.name, tpl.cssUrl);
	}

	function removeCSSFor(templateName) {
		const href = cssHrefByTemplate.get(templateName);
		if (!href) return;
		removeCSS(href);
		cssHrefByTemplate.delete(templateName);
	}

	async function getTemplateHTML(tpl) {
		if (!tpl.htmlUrl) return { virtualRoot: null, inlineStyles: [] };
		let cached = htmlCache.get(tpl.htmlUrl);
		if (!cached) {
			const raw = await getHTML(tpl.htmlUrl);
			const { htmlWithoutStyles, styles } = extractInlineStyles(raw);
			const root = parseFirstElement(htmlWithoutStyles);
			cached = { virtualRoot: root, inlineStyles: styles };
			htmlCache.set(tpl.htmlUrl, cached);
		}
		return cached;
	}

	function mountInlineStyles(templateName, styles = []) {
		if (!styles.length) return;
		const nodes = [];
		for (const cssText of styles) {
			if (!cssText) continue;
			const s = document.createElement('style');
			s.type = 'text/css';
			s.setAttribute('data-template-inline-style', templateName);
			s.appendChild(document.createTextNode(cssText));
			document.head.appendChild(s);
			nodes.push(s);
		}
		inlineStyleNodesByTemplate.set(templateName, nodes);
	}

	function removeInlineStyles(templateName) {
		const nodes = inlineStyleNodesByTemplate.get(templateName);
		if (!nodes) return;
		for (const n of nodes) {
			if (n && n.parentNode) n.parentNode.removeChild(n);
		}
		inlineStyleNodesByTemplate.delete(templateName);
		// Also remove any orphaned styles with the same marker (defensive)
		document.querySelectorAll(`style[data-template-inline-style="${templateName}"]`).forEach(n => n.remove());
	}

	return {
		// IO + injections
		ensureFonts,
		ensureCSS,
		removeCSSFor,
		getTemplateHTML,
		mountInlineStyles,
		removeInlineStyles,

		// (optional) debugging
		_debug() {
			return {
				fonts: Array.from(fontSet),
				htmlCacheKeys: Array.from(htmlCache.keys()),
				cssByTemplate: Array.from(cssHrefByTemplate.entries()),
				inlineStylesByTemplate: Array.from(inlineStyleNodesByTemplate.keys())
			};
		}
	};
}
