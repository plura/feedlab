// assets/js/layout/grid.js
// Builds posts into an existing grid element and enriches each post with a `.host` element.

import { el } from '../core/utils.js';

export function buildGrid(posts, { gridElement, imageBase = 'assets/media/' } = {}) {
	if (!gridElement) throw new Error('[Grid] gridElement is required');

	gridElement.innerHTML = ''; // clear if re-building
	const frag = document.createDocumentFragment();

	posts.forEach((item) => {
		const article = el('article', { class: 'plura-vs-post' });
		if (item.category) article.setAttribute('data-category', item.category);

		const src = (item.image?.startsWith('http') || item.image?.startsWith('assets/'))
			? item.image
			: `${imageBase}${item.image || ''}`;

		const img = el('img', {
			src,
			alt: item.title ? `${item.title} — Visual` : 'Post visual'
		});

		const media = el('div', { class: 'plura-vs-media' }, img);
		const layerHost = el('div', { class: 'plura-vs-layer-host' });

		article.append(media, layerHost);
		frag.appendChild(article);

		// attach atomic replace target back onto the data object
		item.host = layerHost;
	});

	gridElement.appendChild(frag);
	return posts; // enriched with `host`
}
