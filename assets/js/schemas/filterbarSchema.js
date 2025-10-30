// assets/js/schemas/filterbarSchema.js
// Factory that returns the filter bar schema using runtime values.

export function createFilterSchema({ templates = [], initialTheme = 'light' } = {}) {
	return [
		{
			type: 'select',
			name: 'template',
			label: 'Template',
			options: templates.map(t => ({
				value: t.name,
				label: t.title || t.name
			}))
		},
		{
			type: 'toggle',
			name: 'theme',
			label: 'Theme',
			values: ['light', 'dark'],
			initial: initialTheme,
			buttonLabelFormat: '%'
		}
	];
}
