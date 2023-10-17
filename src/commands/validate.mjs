import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import util from 'node:util'

import { asyncGunzip } from '@everymundo/aws-sdk-v3-helpers/lib/zipper.mjs'
import { parseJson } from '@everymundo/json-utils'
import httpClient from '@everymundo/http-client'
import Ajv from 'ajv'

export default validate
export async function validate (options, command) {
  const setupJson = parseJson(await fs.readFile('setup.json'))

  return validateSetupJson(setupJson)
}

export async function validateSetupJson (setupJson) {
  const tempFilePath = path.join(os.tmpdir(), 'setup-json-spec-schema-minified-cached.json')

  const stat = await fs.stat(tempFilePath).catch(e => e)

  let schema
  if (stat instanceof Error || Date.now() - stat.ctime.getTime() > 864000) {
    // const res = await httpClient.get('https://danielsan.github.io/registry-labs/setup-json-spec/schema-minified.json.gz')
    const res = await httpClient.get('https://everymundo.github.io/registry/playground/setup-schema.json')
    const buffer = res.responseBuffer
    schema = (buffer[0] === 0x1f && buffer[1] === 0x8b)
      ? parseJson(await asyncGunzip(buffer))
      : parseJson(buffer)

    await fs.writeFile(tempFilePath, JSON.stringify(schema))

    console.log({ schema })
  }

  // console.log({ diff: Date.now() - stat.ctime.getTime() })

  if (schema == null) {
    schema = parseJson(await fs.readFile(tempFilePath))
  }

  // console.log({ schema })
  const ajv = new Ajv({ allErrors: true, validateFormat: false, allowUnionTypes: true })

  ajv.addFormat('json', true)
  ajv.addVocabulary(['help', 'showIf', 'enumNames', 'placeholder'])
  
  const validate = ajv.compile(schema)

  if (!validate(setupJson)) {
    console.error(
      util.inspect(
        Object.fromEntries(validate.errors.map((v, i) => [i+1, v])),
        { depth: 10, colors: true, compact: true }
      )
    )

    throw new Error('Invalid setup.json')
  }
}