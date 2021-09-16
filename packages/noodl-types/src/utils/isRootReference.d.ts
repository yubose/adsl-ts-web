import { ReferenceString } from '../ecosTypes';
/**
 * true: "."
 *
 * true: "=."
 *
 * false: "=.."
 *
 * false: ".."
 */
export default function isRootReference(v?: string): v is ReferenceString<string, '.'>;
