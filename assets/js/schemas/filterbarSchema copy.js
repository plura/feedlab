// assets/js/schemas/filterbarSchema.js

// Build-time schema for the FilterBar UI.
// - template: select
// - theme: light/dark toggle
// - mobile: off/on toggle (adds .is-mobile on app)
// - ratio: radio group (1/1 or 4/5)

export function createFilterSchema( values = {}) {


	return [
		{
			type: 'select',
			name: 'template',
			label: 'Template',
			options: values.templates?.map(t => ({
				value: t.name,
				label: t.title || t.name
			}))
		},
		{
			type: 'toggle',
			name: 'theme',
			label: 'Theme',
			values: ['light', 'dark'],
			initial: 'light',
			buttonLabelFormat: '%'
		},
		{
			type: 'toggle',
			name: 'mobile',
			label: 'Mobile layout',
			values: ['off', 'on'],
			initial: 'off',
			buttonLabelFormat: 'Mobile: %'
		},
		{
			type: 'radio',
			name: 'ratio',
			label: 'Aspect ratio',
			initial: || '4/5',
			options: [
				{ value: '1/1', label: '1:1' },
				{ value: '4/5', label: '4:5' }
			]
		}
	];
}

export default createFilterSchema;
