import { el } from '../core/utils.js';
import { Nav } from './panel/nav.js';
import { FilterBar } from './panel/filterbar.js';

export const Panel = {

	init({container, templateManager} = {}) {

		if (!container) throw new Error('[Panel] container is required');

		const panelElement = el('div', { class: 'plura-vs-panel' });
		const navHost	= el('div', { class: 'plura-vs-nav' });
		const filterbarHost = el('div', { class: 'plura-vs-filterbar' });

		container.append( panelElement );
		panelElement.append(navHost, filterbarHost);

		// Build Nav
		Nav.init({
			container: navHost,
			themeTarget: container,
		});

		// Build FilterBar using available templates
		const templates = templateManager.list(); // [{ name, title }, ...]
		FilterBar.init({
			container:   filterbarHost,
			themeTarget: container,
			onUpdate: async (data) => {
				
				if (data.template) {
					await templateManager.apply(data.template);
				}
				// (future) handle more filters here
			},
			config: { options: {templates } }
		});

		


	}




}