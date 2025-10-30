// assets/js/app.js
// App shell: sidebar + main, mounts FilterBar + Grid, connects Templates.

import { Templates as TemplateManager } from './templates/templatesManager.js';
import { buildGrid } from './layout/grid.js';
import { FilterBar } from './layout/filterbar.js';
import { el } from './core/utils.js';

export const App = {
	init: async ({
		rootSelector   = '#app',
		postsUrl       = 'assets/data/posts.json',
		templatesUrl   = 'assets/data/templates.json',
		imageBase      = 'assets/media/',
		scheme         = '' // optional class on app shell
	} = {}) => {
		const root = document.querySelector(rootSelector);
		if (!root) throw new Error(`Root not found: ${rootSelector}`);

		// App wrapper (sidebar + main)
		const app     = el('div', { class: `plura-vs-app ${scheme}`.trim() });
		const sidebar = el('aside', { class: 'plura-vs-sidebar' });
		const main    = el('main',  { class: 'plura-vs-main' });
		root.append(app);
		app.append(sidebar, main);

		// Mount points
		const filterbarHost = el('div',    { class: 'plura-vs-filterbar' });
		const gridHost      = el('section',{ class: 'plura-vs-grid' });
		sidebar.append(filterbarHost);
		main.append(gridHost);

		// Data + grid
		const posts    = await fetch(postsUrl).then(r => r.json());
		const enriched = buildGrid(posts, { gridElement: gridHost, imageBase }); // attaches .host

		// Templates
		await TemplateManager.init(templatesUrl);
		TemplateManager.setContext(enriched);
		const templates = TemplateManager.list(); // [{name,title}, ...]

		// Filter bar
		FilterBar.init({
			container:   filterbarHost,
			themeTarget: app,
			templates,
			onFilterChange: async (data) => {
				if (data.template) await TemplateManager.apply(data.template);
				// (future) handle more filters here
			}
		});

		// First render
		const first = templates[0]?.name;
		if (first) await TemplateManager.apply(first);

		// Debug
		window.TemplateManager = TemplateManager;
	}
};
