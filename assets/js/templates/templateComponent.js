// assets/js/templateComponent.js
// ------------------------------------------------------------
// TemplateComponent — responsible for binding data to a cloned
// template node and returning the rendered element.
// ------------------------------------------------------------

export class TemplateComponent {
	constructor(virtualRoot, bindings = {}) {
		this.virtualRoot = virtualRoot;
		this.bindings = bindings;
	}

	/**
	 * Render one item by cloning the virtual template root,
	 * then binding data fields to DOM elements.
	 * @param {Object} data
	 * @param {number} index
	 * @returns {HTMLElement}
	 */
	render(data = {}, index = 0) {
		if (!this.virtualRoot) throw new Error('[TemplateComponent] Missing template root');
		const node = this.virtualRoot.cloneNode(true);

		// Apply bindings (field → selector)
		for (const [field, selector] of Object.entries(this.bindings)) {
			const el = node.querySelector(selector);
			if (!el || data[field] == null) continue;
			el.textContent = data[field];
		}

		return node;
	}
}
