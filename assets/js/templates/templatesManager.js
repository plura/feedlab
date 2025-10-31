// assets/js/templates/templatesManager.js
// ------------------------------------------------------------
// Templates Manager — orchestrates templates using a feed manifest
// - Accepts inline registry (obj/array): { name, title, path, component{html,css}, fonts[], bindings{} }
// - Resolves URLs relative to feed.json (and per-template 'path')
// - Delegates asset IO/injections to TemplateLoader
// - Delegates node rendering/binding to TemplateComponent
// ------------------------------------------------------------

import { createTemplateLoader } from './templateLoader.js';
import { createTemplateComponent } from './templateComponent.js';

const store = {
	feedBase: null,
	labels: null,
	templates: [],
	activeName: null,
	posts: []
};

// Caches
const componentCache = new Map(); // templateName -> component instance
const loader = createTemplateLoader();

function toArray(x) { return Array.isArray(x) ? x : (x ? [x] : []); }

export const Templates = {
	/**
	 * @param {Object} opts
	 * @param {Array|Object} opts.registry  Inline templates registry (array or single object)
	 * @param {URL} opts.feedBase           Base URL for resolving relative paths
	 * @param {Object} [opts.labels]        Optional labels map (for future filters/UI)
	 */
	async init({ registry, feedBase, labels } = {}) {
		store.feedBase = feedBase instanceof URL ? feedBase : new URL(String(feedBase), location.href);
		store.labels = labels || null;

		const list = toArray(registry);
		if (!list.length) throw new Error('[Templates] Empty registry.');

		// Normalize & resolve URLs for each template
		store.templates = list.map((t) => {
			const baseTpl = t.path ? new URL(t.path, store.feedBase) : store.feedBase;
			const htmlUrl = t?.component?.html ? new URL(t.component.html, baseTpl).toString() : null;
			const cssUrl  = t?.component?.css  ? new URL(t.component.css,  baseTpl).toString() : null;
			const fonts   = toArray(t.fonts).map(f => new URL(f, baseTpl).toString());
			return {
				name: t.name,
				title: t.title || t.name,
				baseTpl,
				htmlUrl,
				cssUrl,
				fonts,
				bindings: t.bindings || {}
			};
		});

		return this.list();
	},

	setContext(posts) {
		store.posts = Array.isArray(posts) ? posts : [];
	},

	list() {
		return store.templates.map(t => ({ name: t.name, title: t.title }));
	},

	/**
	 * Swap to a template:
	 * - Ensure fonts (persist, deduped)
	 * - Remove previous template CSS + inline styles
	 * - Ensure new template CSS
	 * - Load/cached HTML (+ inline styles), mount inline styles
	 * - Render per post via TemplateComponent
	 */
	async apply(name) {
		const tpl = store.templates.find(t => t.name === name) || store.templates[0];
		if (!tpl) return;

		// Fonts persist (never removed)
		loader.ensureFonts(tpl);

		// Remove previous CSS + inline styles (for previously active template)
		if (store.activeName && store.activeName !== tpl.name) {
			loader.removeCSSFor(store.activeName);
			loader.removeInlineStyles(store.activeName);
		}

		// Ensure current template CSS
		loader.ensureCSS(tpl);

		// Load HTML + extract inline styles (cached)
		const { virtualRoot, inlineStyles } = await loader.getTemplateHTML(tpl);
		if (!virtualRoot) return;

		// Mount current inline styles
		loader.mountInlineStyles(tpl.name, inlineStyles);

		// Component: build or reuse for this template
		let component = componentCache.get(tpl.name);
		if (!component) {
			component = createTemplateComponent(virtualRoot, tpl.bindings || {});
			componentCache.set(tpl.name, component);
		}

		// Render per post (atomic replace)
		for (const data of store.posts) {
			const host = data?.host;
			if (!host) continue;
			const node = component.render(data);
			host.replaceChildren(node);
		}

		store.activeName = tpl.name;
	},

	async switch(name) { return this.apply(name); },

	async refresh() {
		if (!store.activeName) return;
		await this.apply(store.activeName);
	}
};
