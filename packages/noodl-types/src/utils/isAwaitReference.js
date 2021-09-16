/**
 * true: ".Global.currentUser.vertex.name.firstName@"
 *
 * true: "..message.doc.1.name@"
 *
 * false: "..message.doc.1.name"
 */
export default function isAwaitReference(v = '') {
    if (v.startsWith('@'))
        return true;
    return false;
}
//# sourceMappingURL=isAwaitReference.js.map