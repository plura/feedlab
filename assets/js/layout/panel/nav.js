import { el, schemaData } from "../../core/utils.js";
import { setValues } from "../../core/objectState.js";
import { FormBuilder } from '../../core/formBuilder.js';
import { getSchema } from "../../schemas/navSchema.js";


const params = {

	filterbar: {
		storageKey: 'plura:filterbar',
		apply(targetEl, state) {
			if (!targetEl) return;
			targetEl.classList.toggle('ui-filterbar', state === 'on');
			//localStorage.setItem(FILTERBAR_KEY, state);
		},
/* 		initial( storageKey ) {
			const saved = getStoredValue( storageKey );
			return ['on', 'off'].includes(saved) ? saved : 'off';
		} */
	}

}


export const Nav = {

	init({ container, themeTarget, onUpdate, config = {} }) {

		if (!container) throw new Error('[Nav] container is required');

		const host = el('div', { class: 'plura-vs-nav' });

		const { schema, initialValues } = schemaData( getSchema(config) );

		setValues(themeTarget, params, initialValues);

		const { form } = FormBuilder.create(schema, { 
			initialValues,
			onUpdate: (data) => {
				// Apply view-affecting changes locally

				setValues(themeTarget, params, data);

				// Bubble up full filter data (template selection, etc.)
				onUpdate?.(data);
			}
		});

		host.append(form);

		container.append(host);

		return { host, form };

	}

}