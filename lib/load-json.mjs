import fs from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseJson } from '@everymundo/json-utils'

export const loadRelativeJson = async (meta, ...args) =>
  parseJson(await fs.readFile(resolve(join(dirname(fileURLToPath(meta.url)), ...args))))