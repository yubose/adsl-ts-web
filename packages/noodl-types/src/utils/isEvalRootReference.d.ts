import { ReferenceString } from '../ecosTypes';
/**
 * true: "=."
 *
 * false: "=.."
 */
export default function isEvalRootReference(v?: string): v is ReferenceString<string, '=.'>;
