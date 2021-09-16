/**
 * Returns true if the value is prefixed with ~/ (placeholder for base url)
 *
 * true: "~/myBaseUrl"
 *
 * false: "/myBaseUrl"
 *
 * false: "myBaseUrl"
 *
 * false: "~myBaseUrl"
 *
 * @param v Reference string
 * @returns { boolean }
 */
export default function isTildeReference(v = '') {
    return v.startsWith('~/');
}
//# sourceMappingURL=isTildeReference.js.map