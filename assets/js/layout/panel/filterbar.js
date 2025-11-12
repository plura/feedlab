// assets/js/layout/filterbar.js

import { el, schemaData } from '../../core/utils.js';
import { setValues } from '../../core/objectState.js';	
import { FormBuilder } from '../../core/formBuilder.js';
import { getSchema } from '../../schemas/filterbarSchema.js';

const params = {
	mobile: {
		storageKey: 'plura:mobile',
		apply(targetEl, state) {
			if (!targetEl) return;
			targetEl.classList.toggle('is-mobile', state === 'on');
			//localStorage.setItem(MOBILE_KEY, state);
		},
/* 		initial( storageKey ) {
			const saved = getStoredValue(storageKey);
			return (saved === 'on' || saved === 'off') ? saved : 'off';
		} */
	},
	theme: {
		storageKey: 'plura:theme',
		apply(targetEl, state) {
			if (!targetEl) return;
			targetEl.classList.remove('theme-light', 'theme-dark');
			targetEl.classList.add(`theme-${state}`);
			//targetEl.classList.add(state === 'dark' ? 'theme-dark' : 'theme-light');
		},
/* 		initial( storageKey ) {
			const saved = getStoredValue(storageKey);
			return (saved === 'light' || saved === 'dark') ? saved : 'light';
		} */
	},
	ratio: {
		storageKey: 'plura:ratio',
		apply(targetEl, state) {
			if (!targetEl) return;
			targetEl.classList.remove('ratio-1-1', 'ratio-4-5');
			targetEl.classList.add(`ratio-${state.replace('/', '-')}`);
			//targetEl.classList.add(state === '1/1' ? 'ratio-1-1' : 'ratio-4-5');
		},
/* 		initial( storageKey ) {
			const saved = getStoredValue(storageKey);
			return (saved === '1/1' || saved === '4/5') ? saved : '4/5';
		} */
	}
}



/* -----------------------------------------------------------
	Public API
----------------------------------------------------------- */

export const FilterBar = {
	/**
	 * Initialize filter bar UI.
	 * @param {Object} opts
	 * @param {HTMLElement} opts.container - Where to mount the filter bar
	 * @param {HTMLElement} opts.themeTarget - App shell element to receive classes
	 * @param {Array} opts.templates - [{ name, title }]
	 * @param {Function} opts.onUpdate - callback(data)
	 */
	init({ container, themeTarget, onUpdate, config = {} } = {}) {
		if (!container) throw new Error('[FilterBar] container is required');

		const host = el('div', { class: 'plura-vs-filterbar' });

		// Build form from schema
		const { schema, initialValues } = schemaData( getSchema(config) );

		setValues(themeTarget, params, initialValues);

		const { form } = FormBuilder.create(schema, {
			initialValues,
			onUpdate: (data) => {
				// Apply view-affecting changes locally

				setValues(themeTarget, params, {
					theme: data.theme,
					mobile: data.mobile,
					ratio: data.ratio
				});

				// Bubble up full filter data (template selection, etc.)
				onUpdate?.(data);
			}
		});

		host.append(form);
		
		container.append(host);

		return { host, form };
	}
};

export default FilterBar;
