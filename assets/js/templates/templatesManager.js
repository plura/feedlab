// assets/js/templates.js
// ------------------------------------------------------------
// Role: Template Manager (UI-agnostic)
// - Loads minimal registry [{ name, path }]
// - Loads per-template config.json (fonts + bindings)
// - Injects fonts once (kept), swaps template CSS (remove old, add new)
// - Fetches & caches HTML, clones it, binds data, and atomically replaces
//   into the provided `post.host` (no grid selectors).
// ------------------------------------------------------------

import { injectCSS, removeCSS, getHTML } from '../core/utils.js';

const store = {
	templates: [],        // { name, title, path, config, htmlUrl, cssUrl }
	activeName: null,
	activeCssHref: null,
	posts: []             // array of { title, caption, image, category, host: HTMLElement }
};

export const Templates = {
	async init(registryUrl) {
		const list = await fetch(registryUrl).then(r => r.json());
		if (!Array.isArray(list) || list.length === 0) {
			throw new Error('[Templates] Empty registry.');
		}

		const expanded = [];
		for (const t of list) {
			const basePath = t.path || '';
			const cfgUrl = basePath + 'config.json';
			const cfg = await fetch(cfgUrl).then(r => r.json());

			expanded.push({
				name:   cfg.name  || t.name,
				title:  cfg.title || t.title || t.name,
				path:   basePath,
				config: cfg,
				htmlUrl: basePath + 'render.html',
				cssUrl:  basePath + 'styles.css'
			});
		}
		store.templates = expanded;
		return expanded.map(x => ({ name: x.name, title: x.title }));
	},

	/**
	 * Provide posts enriched with `.host` elements; manager stays UI-agnostic.
	 */
	setContext(posts) {
		store.posts = Array.isArray(posts) ? posts : [];
	},

	list() {
		return store.templates.map(t => ({ name: t.name, title: t.title, path: t.path }));
	},

	/**
	 * Apply/swap the active template:
	 * - inject fonts (deduped; never removed)
	 * - remove previous template CSS and inject the new CSS
	 * - fetch & parse HTML, bind via config.bindings, and replace into each post.host
	 */
	async apply(name) {
		const tpl = store.templates.find(t => t.name === name) || store.templates[0];
		if (!tpl) return;

		// 1) Fonts persist; inject once (deduped by utils)
		if (Array.isArray(tpl.config.fonts)) {
			for (const url of tpl.config.fonts) {
				injectCSS(url, { kind: 'font' });
			}
		}

		// 2) Remove previous template CSS (fonts are left intact)
		if (store.activeCssHref && store.activeCssHref !== tpl.cssUrl) {
			removeCSS(store.activeCssHref);
		}

		// 3) Inject current template CSS (cached by href)
		injectCSS(tpl.cssUrl, { id: `tpl-css-${tpl.name}`, 'data-asset': 'css', kind: 'css' });
		store.activeCssHref = tpl.cssUrl;
		store.activeName = tpl.name;

		// 4) Load & parse HTML once; clone per post
		const html = await getHTML(tpl.htmlUrl);
		const parserHost = document.createElement('div');
		parserHost.innerHTML = html;
		const virtualRoot = parserHost.firstElementChild;
		if (!virtualRoot) return;

		// 5) Bind & atomically replace into each provided host (no selectors)
		const bindings = tpl.config.bindings || {};
		for (const data of store.posts) {
			const host = data?.host;
			if (!host) continue;

			const node = virtualRoot.cloneNode(true);

			for (const [key, selector] of Object.entries(bindings)) {
				const el = node.querySelector(selector);
				if (!el) continue;
				el.textContent = data?.[key] ?? '';
			}

			host.replaceChildren(node);
		}
	},

	/** Convenience alias */
	async switch(name) { return this.apply(name); },

	/** Reapply the current template to current posts */
	async refresh() {
		if (!store.activeName) return;
		await this.apply(store.activeName);
	}
};
