import { ReferenceString } from '../ecosTypes';
/**
 * true: "=.."
 *
 * false: "=."
 */
export default function isEvalLocalReference(v?: string): v is ReferenceString<string, '=..'>;
