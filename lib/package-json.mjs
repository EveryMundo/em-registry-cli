import { loadRelativeJson } from './load-json.mjs'
export default (await loadRelativeJson(import.meta, '..', 'package.json'))
