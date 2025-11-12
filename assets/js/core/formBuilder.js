// assets/js/core/formBuilder.js
import { el } from './utils.js';

/* -----------------------------------------------------------
	Tiny control factory for FormBuilder
	- Explicit handlers map per control (e.g., { change: notify })
	- Allows future extension via attrs
	- Uses for...of so you could break/continue if needed
----------------------------------------------------------- */
function formEl({
	tag = 'input',
	type = 'text',
	name,
	id,
	value,
	required = false,
	attrs = null,
	handlers = {}, // e.g., { change: notify } or { input: notify }
}) {
	const node = el(tag, {
		type,
		name,
		id,
		...(value != null ? { value } : {}),
		...(required ? { required: true } : {}),
		...(attrs && typeof attrs === 'object' ? attrs : {}),
	});

	// Using for...of allows break/continue vs forEach (as requested)
	for (const [event, handler] of Object.entries(handlers)) {
		if (typeof handler === 'function' && /(click|change|input|focus|blur|keydown|keyup)/.test(event)) {
			node.addEventListener(event, handler, false);
		}
	}

	return node;
}

/* -----------------------------------------------------------
	Shared wrappers
----------------------------------------------------------- */

function ensureId({ id, name }) {
	if (id) return id;
	const base = (name || 'f').replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '').toLowerCase();
	return `${base}-${Math.random().toString(36).slice(2, 8)}`;
}

function wrapField(meta, control) {
	const { name, label, id, hint } = meta;
	const fid = id || ensureId({ id, name });
	if (control && !control.id) control.id = fid;

	const labelEl = label ? el('label', { for: fid }, label) : null;
	const hintEl = hint ? el('div', { class: 'form-hint' }, hint) : null;

	// IMPORTANT: match your CSS expectations (form-group)
	const field = el('div', { class: 'form-group', 'data-fb-name': name || '' });
	if (labelEl) field.append(labelEl);
	field.append(control);
	if (hintEl) field.append(hintEl);
	return field;
}

/* -----------------------------------------------------------
	Builders
----------------------------------------------------------- */

// SELECT
function buildSelect(field, notify) {
	const { name, label, options = [], initial, attrs = {}, required, id, hint } = field;

	const select = formEl({
		tag: 'select',
		name,
		id,
		required,
		attrs,
		handlers: { change: notify }
	});

	for (const opt of options) {
		const value = typeof opt === 'string' ? opt : opt.value;
		const text  = typeof opt === 'string' ? opt : (opt.label ?? opt.value);
		select.append(el('option', { value }, text));
	}
	if (initial != null) select.value = initial;

	return wrapField({ name, label, id, hint }, select);
}

// RADIO group (label wraps input) — matches your .radio-group CSS
function buildRadio(field, notify) {
	const { name, label, options = [], initial, attrs = {}, required, id, hint } = field;
	const gid = ensureId({ id, name });

	const group = el('div', { class: 'radio-group', role: 'radiogroup' });

	for (const opt of options) {
		const value = typeof opt === 'string' ? opt : opt.value;
		const text  = typeof opt === 'string' ? opt : (opt.label ?? opt.value);
		const rid = `${gid}-${String(value).replace(/[^a-z0-9]+/gi, '-')}`;

		const input = formEl({
			tag: 'input',
			type: 'radio',
			name,
			id: rid,
			required,
			attrs,
			handlers: { change: notify }
		});
		input.value = value;
		if (initial != null && String(initial) === String(value)) input.checked = true;

		// label wraps input (your CSS targets label > input)
		const row = el('label', { for: rid }, input, ' ', text);
		group.append(row);
	}

	return wrapField({ name, label, id: gid, hint }, group);
}

// TOGGLE (two-state button)
// field: { name, label, values: ['light','dark'], initial, buttonLabelFormat }
function buildToggle(field, notify) {
	const { name, label, values = ['off', 'on'], initial, id, hint, buttonLabelFormat } = field;
	const [v0, v1] = values;
	const current = (initial != null ? String(initial) : String(v0));

	const btn = formEl({
		tag: 'button',
		type: 'button',
		name, // optional, retained for data linkage
		id,
		attrs: {
			class: 'form-toggle',
			'data-fb-name': name,
			'data-fb-value': current
		},
		handlers: {
			click: () => {
				const next = (btn.dataset.fbValue === String(v1)) ? String(v0) : String(v1);
				btn.dataset.fbValue = next;
				btn.textContent = buttonLabelFormat ? buttonLabelFormat.replace('%', next) : next;
				btn.setAttribute('aria-checked', String(next === String(v1)));
				notify();
			}
		}
	});

	btn.textContent = buttonLabelFormat ? buttonLabelFormat.replace('%', current) : current;
	btn.setAttribute('role', 'switch');
	btn.setAttribute('aria-checked', String(current === String(v1)));

	return wrapField({ name, label, id, hint }, btn);
}

/* -----------------------------------------------------------
	Public helpers
----------------------------------------------------------- */

export function getData(form) {
	const data = {};
	form.querySelectorAll('input, select, textarea, [data-fb-name]').forEach(elm => {
		const name = elm.name || elm.dataset.fbName;
		if (!name) return;

		// custom toggle/data widgets
		if (elm.matches('[data-fb-name]')) {
			data[name] = elm.dataset.fbValue ?? '';
			return;
		}

		// radios collect single checked
		if (elm.type === 'radio') {
			if (elm.checked) data[name] = elm.value;
			return;
		}

		// checkboxes collect array of checked
		if (elm.type === 'checkbox') {
			if (!data[name]) data[name] = [];
			if (elm.checked) data[name].push(elm.value);
			return;
		}

		data[name] = elm.value;
	});
	return data;
}

export function setData(form, values = {}) {
	Object.entries(values).forEach(([k, v]) => {
		const fields = form.querySelectorAll(`[name="${k}"]`);
		if (fields.length) {
			const first = fields[0];

			if (first.type === 'radio') {
				fields.forEach(f => f.checked = (String(f.value) === String(v)));
				return;
			}

			if (first.type === 'checkbox') {
				const set = new Set(Array.isArray(v) ? v.map(String) : [String(v)]);
				fields.forEach(f => f.checked = set.has(String(f.value)));
				return;
			}

			if (first.tagName === 'SELECT') {
				first.value = v;
				return;
			}

			first.value = v;
			return;
		}

		const custom = form.querySelector(`[data-fb-name="${k}"]`);
		if (custom) {
			custom.dataset.fbValue = v;
			custom.textContent = custom.dataset.fbLabelFormat
				? custom.dataset.fbLabelFormat.replace('%', v)
				: String(v);
		}
	});
}

/* -----------------------------------------------------------
	Main factory
----------------------------------------------------------- */

export const FormBuilder = {
	create(schema = [], { onUpdate, initialValues } = {}) {
		// IMPORTANT: match your CSS root class
		const form = el('form', {
			class: 'plura-vs-form',
			on: { submit: e => e.preventDefault() }
		});

		const notify = () => {
			const data = getData(form);
			onUpdate?.(data);
		};

		for (const field of schema) {
			let node = null;
			switch (field.type) {
				case 'select':
					node = buildSelect(field, notify);
					break;
				case 'radio':
					node = buildRadio(field, notify);
					break;
				case 'toggle':
					node = buildToggle(field, notify);
					break;
				default: {
					// simple text-like input fallback
					const { name, label, initial, id, hint, attrs = {}, required } = field;
					const input = formEl({
						tag: 'input',
						type: field.type || 'text',
						name,
						id,
						value: initial ?? '',
						required,
						attrs,
						handlers: { input: notify }
					});
					node = wrapField({ name, label, id, hint }, input);
				}
			}
			form.append(node);
		}

		// apply initial values after DOM is ready
		if (initialValues) setData(form, initialValues);

		return { form }
	}
};

export default FormBuilder;
