export function getSchema(config = {}) {

	return [
		{
			type: 'toggle',
			name: 'filterbar',
			label: 'Filter',
			values: ['on', 'off'],
			initial: 'on',
			buttonLabelFormat: 'Sidebar: %'
		}
	]

}

export default getSchema;