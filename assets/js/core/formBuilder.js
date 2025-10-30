// assets/js/core/formBuilder.js
// Minimal, generic form builder for simple control schemas.
// Now supports: select, toggle, input(text-like) with label+control wrapper.

import { el } from './utils.js';

function asArray(v) { return Array.isArray(v) ? v : (v != null ? [v] : []); }
function emitChange(form, onChange) { if (onChange) onChange(getData(form)); }

// Simple id generator so <label for> always has a target
let _idCounter = 0;
function ensureId(field) {
	if (field.id) return field.id;
	const base = (field.name || 'field').replace(/\s+/g, '-').toLowerCase();
	_idCounter += 1;
	return `${base}-${_idCounter}`;
}

export function getData(form) {
	const data = {};
	new FormData(form).forEach((v, k) => (data[k] = v));
	form.querySelectorAll('[data-fb-name]').forEach((n) => {
		const name = n.dataset.fbName;
		if (!(name in data)) data[name] = n.dataset.fbValue ?? '';
	});
	return data;
}

export function setData(form, values = {}) {
	Object.entries(values).forEach(([k, v]) => {
		const field = form.querySelector(`[name="${k}"]`);
		if (field) {
			if (field.tagName === 'SELECT') field.value = v;
			else field.value = v;
		} else {
			const custom = form.querySelector(`[data-fb-name="${k}"]`);
			if (custom) {
				custom.dataset.fbValue = v;
				custom.textContent = custom.dataset.fbLabelFormat
					? custom.dataset.fbLabelFormat.replace('%', v)
					: String(v);
			}
		}
	});
}

/* ---------- INTERNAL HELPERS ---------- */

// Wraps a control in a .form-group with <label>, control, optional hint
function wrapField(field, control) {
	const { name, label, hint, id: givenId } = field;
	const id = ensureId({ id: givenId, name });

	// Ensure the control has an id (builders set name/required themselves)
	if (control && control.setAttribute && !control.getAttribute('id')) {
		control.setAttribute('id', id);
	}

	const group = el('div', { class: 'form-group' });

	// Label
	if (label) {
		group.append(el('label', { for: id }, label));
	}

	// Control
	group.append(control);

	// Hint (after control) + a11y wiring
	if (hint) {
		const hintId = `${id}-hint`;
		const prevDesc = control.getAttribute('aria-describedby');
		control.setAttribute('aria-describedby', prevDesc ? `${prevDesc} ${hintId}` : hintId);
		group.append(el('div', { id: hintId, class: 'form-hint' }, hint));
	}

	return group;
}

// SELECT builder: sets name/required here; wrapField handles id/label/hint
function buildSelect(field, notify) {
	const {
		name, label, options = [], attrs = {}, required, id, hint
	} = field;

	const select = el('select', {
		name,
		...attrs,
		...(required ? { required: true } : {}),
		on: { change: () => notify() }
	});

	for (const opt of options) {
		const { value, label: text } = typeof opt === 'string'
			? { value: opt, label: opt }
			: opt;
		select.append(el('option', { value }, text));
	}

	return wrapField({ name, label, id, hint }, select);
}


// Cycles values array on click: e.g., ['light','dark']
function buildToggle(field, notify) {
	const { name, label, values = ['off','on'], initial, buttonLabelFormat = '%', attrs = {}, required, id, hint } = field;

	const btn = el('button', {
		type: 'button',
		'data-fb-name': name,
		...attrs,
		on: {
			click: () => {
				const current = btn.dataset.fbValue;
				const idx = Math.max(0, values.indexOf(current));
				const next = values[(idx + 1) % values.length];
				btn.dataset.fbValue = next;
				btn.textContent = buttonLabelFormat.replace('%', next);
				notify();
			}
		}
	}, buttonLabelFormat.replace('%', initial ?? values[0]));

	btn.dataset.fbValue = initial ?? values[0];
	btn.dataset.fbLabelFormat = buttonLabelFormat;

	const group = wrapField({ name, label, required, id, hint }, btn);
	return group;
}


// Supports text-like inputs: text, email, url, tel, number, search, etc.
// INPUT builder: text-like inputs; sets name/required here
function buildInput(field, notify) {
	const {
		name, label, type = 'text', placeholder, autocomplete, inputmode, pattern,
		min, max, step, value, attrs = {}, required, id, hint
	} = field;

	const input = el('input', {
		type, name, placeholder, autocomplete, inputmode, pattern,
		min, max, step, value,
		...attrs,
		...(required ? { required: true } : {}),
		on: {
			input: () => notify(),
			change: () => notify()
		}
	});

	return wrapField({ name, label, id, hint }, input);
}



/* ---------- PUBLIC API ---------- */

export const FormBuilder = {
	create(schema = [], { onChange, initialValues } = {}) {
		const form = el('form', { class: 'plura-vs-form', novalidate: '' });
		const notify = () => emitChange(form, onChange);

		for (const field of asArray(schema)) {
			let node = null;
			switch (field.type) {
				case 'select':
					node = buildSelect(field, notify);
					break;
				case 'toggle':
					node = buildToggle(field, notify);
					break;
				case 'input':
				case 'text':    // alias
				case 'email':   // alias
				case 'url':     // alias
				case 'tel':     // alias
				case 'number':  // alias
				case 'search':  // alias
					// if type is one of the aliases, keep it
					if (field.type !== 'input') field.type = field.type;
					node = buildInput(field, notify);
					break;
				default:
					node = el('div', {}, `Unsupported field: ${field.type || '(none)'}`);
			}
			form.append(node);
		}

		if (initialValues) setData(form, initialValues);
		// emit once with initial state
		emitChange(form, onChange);

		return form;
	},
	getData,
	setData
};
