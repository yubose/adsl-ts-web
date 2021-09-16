import { ReferenceString } from '../ecosTypes';
/**
 * True if the value starts with an equal sign "="
 *
 * true: "=.builtIn.string.concat"
 *
 * false: ".builtIn.string.concat"
 *
 * false: "builtIn.string.concat"
 */
export default function isEvalReference(v?: string): v is ReferenceString<string, '='>;
