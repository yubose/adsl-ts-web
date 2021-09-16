/**
 * True if the value starts with an equal sign "="
 *
 * true: "=.builtIn.string.concat"
 *
 * false: ".builtIn.string.concat"
 *
 * false: "builtIn.string.concat"
 */
export default function isEvalReference(v = '') {
    if (v.startsWith('='))
        return true;
    return false;
}
//# sourceMappingURL=isEvalReference.js.map