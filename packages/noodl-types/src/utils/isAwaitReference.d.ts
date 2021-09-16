import { ReferenceString } from '../ecosTypes';
/**
 * true: ".Global.currentUser.vertex.name.firstName@"
 *
 * true: "..message.doc.1.name@"
 *
 * false: "..message.doc.1.name"
 */
export default function isAwaitReference(v?: string): v is ReferenceString<string, '@'>;
