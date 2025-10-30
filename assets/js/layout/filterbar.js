// assets/js/layout/filterbar.js
// Filter bar view: builds a form via FormBuilder, emits changes,
// and (optionally) applies theme to the provided themeTarget.

import { el } from '../core/utils.js';
import { FormBuilder } from '../core/formBuilder.js';
import { createFilterSchema } from '../schemas/filterbarSchema.js';

function getInitialTheme() {
	const saved = localStorage.getItem('plura:theme');
	return (saved === 'light' || saved === 'dark') ? saved : 'light';
}
function applyTheme(targetEl, mode) {
	if (!targetEl) return;
	targetEl.classList.remove('theme-light', 'theme-dark');
	targetEl.classList.add(mode === 'dark' ? 'theme-dark' : 'theme-light');
	localStorage.setItem('plura:theme', mode);
}

export const FilterBar = {
	/**
	 * @param {Object} cfg
	 * @param {HTMLElement} cfg.container    Where to mount the filter bar (inside sidebar)
	 * @param {HTMLElement} cfg.themeTarget  Element to receive theme classes (the app shell)
	 * @param {Array<{name:string,title:string}>} cfg.templates
	 * @param {(data:Object)=>void|Promise<void>} cfg.onFilterChange
	 */
	init({ container, themeTarget, templates = [], onFilterChange }) {
		if (!container) throw new Error('[FilterBar] container is required');

		const panel = el('div'); // structural only; layout via core.css

		// Build schema using runtime data
		const initialTheme = getInitialTheme();
		applyTheme(themeTarget, initialTheme);

		const schema = createFilterSchema({ templates, initialTheme });

		const form = FormBuilder.create(schema, {
			onChange: (data) => {
				// keep theme purely view-side, but still emit full data
				if (data.theme) applyTheme(themeTarget, data.theme);
				onFilterChange?.(data);
			}
		});

		panel.append(form);
		container.append(panel);
		return { panel, form };
	}
};
