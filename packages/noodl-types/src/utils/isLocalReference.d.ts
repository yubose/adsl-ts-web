import { ReferenceString } from '../ecosTypes';
/**
 * true: ".."
 *
 * true: "=.."
 *
 * false: "=."
 */
export default function isLocalReference(v?: string): v is ReferenceString<string, '..'>;
