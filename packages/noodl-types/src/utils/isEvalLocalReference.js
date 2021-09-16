/**
 * true: "=.."
 *
 * false: "=."
 */
export default function isEvalLocalReference(v = '') {
    if (v.startsWith('=..'))
        return true;
    return false;
}
//# sourceMappingURL=isEvalLocalReference.js.map