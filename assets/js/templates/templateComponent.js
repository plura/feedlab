// assets/js/templateComponent.js
export function createTemplateComponent(virtualRoot, bindings = {}) {
	if (!virtualRoot) throw new Error('[TemplateComponent] Missing template root');

	function bind(node, data) {
		for (const [field, target] of Object.entries(bindings)) {
			const [selector, mode] = Array.isArray(target) ? target : [target, 'text'];
			const el = node.querySelector(selector);
			if (!el) continue;

			const value = data?.[field] ?? '';
			if (mode === 'html') {
				el.innerHTML = value;
			} else if (mode && mode.startsWith('attr:')) {
				const attr = mode.slice(5);
				if (attr) el.setAttribute(attr, value);
			} else {
				el.textContent = value;
			}
		}
		return node;
	}

	function render(data = {}) {
		const node = virtualRoot.cloneNode(true);
		return bind(node, data);
	}

	return { render, bind };
}
