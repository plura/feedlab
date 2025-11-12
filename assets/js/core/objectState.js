// assets/js/core/objectState.js
const isObj = (val) => val && typeof val === 'object' && !Array.isArray(val);

const objHasProp = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);

const isArray = (val) => Array.isArray(val);

const isValid = (val) => val !== undefined && val !== null;

const getStorageKey = (key) => {
	return `${key}`;
}

export const getStoredValue = (key) => {

	try {

		return localStorage.getItem(getStorageKey(key));

	} catch (e) {

		return null;

	}


}

export const setStoredValue = (key, value) => {

	try {

		localStorage.setItem(getStorageKey(key), value);

	} catch (e) {

		return null;

	}

}

export const initialValues = (params) => {

	const obj = {};

	for (const key of Object.keys(params || {})) {

		obj[key] = initialValue(params, key);

	}

	return obj;

}

export const initialValue = (params, key) => {

	if (!params || !params[key]) return null;

	return getStoredValue(params[key].storageKey);
}

//values can both work as 'filter' for 'allowed' params but also a way to set a value
export const setValues = (target, params, values) => {

	const keys = isArray(values) ? values : isObj(values) ? Object.keys(values) : Object.keys(params), returnValues = {};

	for (const key of keys) {

		if (key in params) {

			let val;

			if (isObj(values) && objHasProp(values, key) /* Object.prototype.hasOwnProperty.call(values, key) */) {

				const entry = values[key];

				val = isObj(entry) && entry.value ? entry.value : entry;

			}

			returnValues[key] = setValue(target, params, key, val);

		}

	}

	return returnValues;

}

export const setValue = (target, params, key, value) => {

	const storageKey = params[key].storageKey, v = isValid(value) ? value : initialValue(params, key);

	if( isValid(v) ) {

		if (getStoredValue(storageKey) !== v) {

			setStoredValue(storageKey, v);

		}

		if (typeof params[key].apply === 'function' && isValid(v)) {

			params[key].apply(target, v);

		}

		return v;

	}

}


export default setValues;

