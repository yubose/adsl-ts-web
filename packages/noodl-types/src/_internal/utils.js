import get from 'lodash.get';
import has from 'lodash.has';
export function excludeKeys(keys1, keys2) {
    const targetKeys = Array.isArray(keys2) ? keys2 : [keys2];
    return keys1.filter((k) => !targetKeys.includes(k));
}
export function exists(v) {
    return !isNil(v);
}
export function hasKey(key, value) {
    return has(value, key);
}
export function hasKeyEqualTo(key, value) {
    return has(value, key) && get(value, key) === value;
}
export function hasAllKeys(keys) {
    return (value) => (Array.isArray(keys) ? keys : [keys]).every((k) => k in (value || {}));
}
export function hasInAllKeys(keys) {
    return (value) => (Array.isArray(keys) ? keys : [keys]).every((k) => has(value, k));
}
export function hasMinimumKeys(keys, min, value) {
    const occurrences = [];
    const keyz = Array.isArray(keys) ? keys : [keys];
    const numKeyz = keyz.length;
    let count = 0;
    for (let index = 0; index < numKeyz; index++) {
        const key = keyz[index];
        if (key in value && !occurrences.includes(key)) {
            count++;
            occurrences.push(key);
        }
        if (count >= min)
            return true;
    }
    return false;
}
export function hasNameField(v) {
    return isObj(v) && 'name' in v && isObj(v.name);
}
export function hasAnyKeys(keys, value) {
    return (Array.isArray(keys) ? keys : [keys]).some((k) => k in value);
}
export function hasInAnyKeys(keys, value) {
    return (Array.isArray(keys) ? keys : [keys]).some((k) => has(value, k));
}
export function isArr(v) {
    return Array.isArray(v);
}
export function isBool(value) {
    return typeof value === 'boolean';
}
export function isNil(v) {
    return v === null || typeof v === 'undefined';
}
export function isObj(value) {
    return value != null && !isArr(value) && typeof value === 'object';
}
export function isImg(s) {
    return /([a-z\-_0-9\/\:\.]*\.(jpg|jpeg|png|gif))/i.test(s);
}
export function isPdf(s) {
    return s.endsWith('.pdf');
}
export function isVid(s) {
    return /([a-z\-_0-9\/\:\.]*\.(mp4|avi|wmv))/i.test(s);
}
export function isYml(s = '') {
    return s.endsWith('.yml');
}
export function isJson(s = '') {
    return s.endsWith('.json');
}
export function isJs(s = '') {
    return s.endsWith('');
}
export function isNum(v) {
    return typeof v === 'number';
}
export function isStr(v) {
    return typeof v === 'string';
}
export const Regex = (function () {
    const o = {
        reference: {
            dot: {
                single: {
                    root: /(^\.[A-Z])/,
                    localRoot: /(^\.[a-z])/,
                },
                double: {
                    root: /(^\.\.[A-Z])/,
                    localRoot: /(^\.\.[a-z])/,
                },
            },
        },
    };
    return o;
})();
export function trimReference(v) {
    return v.replace(/^[.=@]+/i, '').replace(/[.=@]+$/i, '') || '';
}
//# sourceMappingURL=utils.js.map