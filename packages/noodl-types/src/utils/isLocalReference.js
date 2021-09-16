/**
 * true: ".."
 *
 * true: "=.."
 *
 * false: "=."
 */
export default function isLocalReference(v = '') {
    if (v.startsWith('..'))
        return true;
    if (v.startsWith('=..'))
        return true;
    return false;
}
//# sourceMappingURL=isLocalReference.js.map