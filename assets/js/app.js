// assets/js/app.js
// App shell: sidebar + main, mounts FilterBar + Grid, connects Templates via a single feed.json

import { Templates as TemplateManager } from './templates/templatesManager.js';
import { buildGrid } from './layout/grid.js';
import { FilterBar } from './layout/filterbar.js';
import { el } from './core/utils.js';

/**
 * Internal: inject a global stylesheet once (for feed-level styles)
 */
const _feedGlobalStyles = new Set();
function injectFeedGlobalStyle(hrefAbs) {
	if (_feedGlobalStyles.has(hrefAbs)) return;
	const link = document.createElement('link');
	link.rel = 'stylesheet';
	link.href = hrefAbs;
	link.setAttribute('data-feed-global-style', '');
	document.head.appendChild(link);
	_feedGlobalStyles.add(hrefAbs);
}

export const App = {
	/**
	 * Initialize the app using a single feed manifest.
	 * @param {Object} config
	 * @param {string} config.rootSelector - CSS selector for the app root container
	 * @param {string} config.feedUrl - URL to feed.json (single source of truth)
	 */
	init: async ({
		rootSelector = '#app',
		feedUrl = 'test/templates/feed.json'
	} = {}) => {
		const root = document.querySelector(rootSelector);
		if (!root) throw new Error(`Root not found: ${rootSelector}`);

		// Load feed and establish a base URL for relative resolution
		const feed = await fetch(feedUrl).then(r => r.json());
		const feedBase = new URL(feedUrl, location.href);

		// App wrapper (sidebar + main)
		const schemeClass = (feed.scheme || '').trim();
		const app     = el('div', { class: `plura-vs-app${schemeClass ? ' ' + schemeClass : ''}` });
		const sidebar = el('aside', { class: 'plura-vs-sidebar' });
		const main    = el('main',  { class: 'plura-vs-main' });
		root.append(app);
		app.append(sidebar, main);

		// Mount points
		const filterbarHost = el('div', { class: 'plura-vs-filterbar' });
		const gridHost      = el('section', { class: 'plura-vs-grid' });
		sidebar.append(filterbarHost);
		main.append(gridHost);

		// Inject optional feed-level global styles (before any template CSS)
		const feedStyles = Array.isArray(feed.styles) ? feed.styles : (feed.styles ? [feed.styles] : []);
		for (const href of feedStyles) {
			const abs = new URL(href, feedBase).toString();
			injectFeedGlobalStyle(abs);
		}

		// Build grid from feed posts; resolve imageBase relative to feed
		const imageBaseURL = feed.mediaBase ? new URL(feed.mediaBase, feedBase) : null;
		const enriched = buildGrid(feed.posts || [], {
			gridElement: gridHost,
			imageBase: imageBaseURL || undefined
		}); // attaches .host to each post

		// Prepare templates registry (allow object or array in feed)
		const raw = feed.templates;
		const registry = Array.isArray(raw) ? raw : (raw ? [raw] : []);

		// Initialize TemplatesManager with inline registry + resolution base + labels
		await TemplateManager.init({
			registry,
			feedBase,           // for resolving template path/html/css
			labels: feed.labels // optional, for future filters/UI
		});
		TemplateManager.setContext(enriched);

		// Build FilterBar using available templates
		const templates = TemplateManager.list(); // [{ name, title }, ...]
		FilterBar.init({
			container:   filterbarHost,
			themeTarget: app,
			templates,
			onFilterChange: async (data) => {
				if (data.template) {
					await TemplateManager.apply(data.template);
				}
				// (future) handle more filters here
			}
		});

		// First render: selectedTemplate from feed, else first
		const firstName = feed.selectedTemplate || templates[0]?.name;
		if (firstName) await TemplateManager.apply(firstName);

		// Debug
		window.TemplateManager = TemplateManager;
	}
};
