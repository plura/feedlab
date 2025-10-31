// assets/js/layout/grid.js
// Builds posts into an existing grid element and enriches each post with a `.host` element.

import { el } from '../core/utils.js';

/**
 * @param {Array} posts
 * @param {Object} options
 * @param {HTMLElement} options.gridElement  (required) grid container
 * @param {URL|string} [options.imageBase]   optional base for resolving post.image
 */
export function buildGrid(posts, { gridElement, imageBase } = {}) {
	if (!gridElement) throw new Error('[Grid] gridElement is required');

	gridElement.innerHTML = ''; // clear if re-building
	const frag = document.createDocumentFragment();

	const base = imageBase
		? (imageBase instanceof URL ? imageBase : new URL(String(imageBase), location.href))
		: null;

	posts.forEach((item) => {
		const article = el('article', { class: 'plura-vs-post' });
		if (item.category) article.setAttribute('data-category', item.category);

		let src = item.image || '';
		try {
			src = base ? new URL(src, base).toString() : src; // resolves absolute/relative correctly
		} catch {
			// fall back to raw value if URL construction fails
		}

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
