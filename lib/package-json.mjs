import fs from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import httpClient from '@everymundo/http-client'
import { parseJson } from '@everymundo/json-utils'

export const packJson = parseJson(
  await fs.readFile(resolve(join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json')))
)