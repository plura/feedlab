// assets/js/core/objectState.js

const isObj = (val) => val && typeof val === 'object' && !Array.isArray(val);

const isArray = (val) => Array.isArray(val);

export const getStoredValue = (key) => {

	return localStorage.getItem(key);

}

export const setStoredValue = (key, value) => {

	localStorage.setItem(key, value);

}

export const initialValues = (params) => {

	const obj = {};

	for(const key of Object.keys(params || {})) {

		obj[key] = initialValue(params, key);

	}

	return obj;

}

export const initialValue = (params, key) => {

	if( !params || !params[key] || typeof params[key].initial !== 'function') return;

	const storageKey = params[key].storageKey, value = params[key].initial( storageKey );

	return value;
}

//values can both work as 'filter' for 'allowed' params but also a way to set a value
export const setValues = (target, params, values) => {

	const keys = isArray(values) ? values : isObj(values) ? Object.keys(values) : Object.keys(params), returnValues = {};

	for(const key of keys) {

		if( key in params ) {

			let val;

			if( isObj(values) && values[key] !== undefined  ) {

				val = values[key].value ?? values[key];

			}

			returnValues[key] = setValue(target, params, key, val );

		}

	}

	return returnValues;

}

export const setValue = (target, params, key, value) => {

	const storageKey = params[key].storageKey, v = value !== undefined ? value : initialValue(params, key);

	if( getStoredValue( storageKey ) !== v ) {

		setStoredValue(storageKey, v);

	}

	if( typeof params[key].apply === 'function' ) {

		params[key].apply(target, v);

	}

	return v;

}


export default setValues;

