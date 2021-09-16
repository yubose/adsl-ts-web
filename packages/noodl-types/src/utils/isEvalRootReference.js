/**
 * true: "=."
 *
 * false: "=.."
 */
export default function isEvalRootReference(v = '') {
    if (v.startsWith('=.'))
        return true;
    return false;
}
//# sourceMappingURL=isEvalRootReference.js.map