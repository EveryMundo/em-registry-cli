import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import util from 'node:util'
import Ajv from 'ajv'
import httpClient from '@everymundo/http-client'
import { checkBackwardCompatibility } from '@everymundo/registry-setup-json-spec/check-backward-compatibility.mjs'
import { parseJson } from '@everymundo/json-utils'

import identity from '../../lib/identity.mjs'
import modLib from '../../lib/module-id.mjs'
import registryApis, { ErrorResponse } from '../../lib/registry-webapis.mjs'

export default validate
export async function validate (options, command) {
  const mod = modLib.getModule()
  const setupJson = parseJson(await fs.readFile(`${mod.buildDirectory}/setup.json`))

  await validateSetupJson(setupJson)
  await validateBackwardCompatibility(setupJson, command)
}

export async function validateSetupJson (setupJson) {
  const tempFilePath = path.join(os.tmpdir(), 'setup-json-spec-schema-minified-cached.json')
  const stat = await fs.stat(tempFilePath).catch(e => e)

  let schema
  if (stat instanceof Error || Date.now() - stat.ctime.getTime() > 864000) {
    // const res = await httpClient.get('https://danielsan.github.io/registry-labs/setup-json-spec/schema-minified.json.gz')
    const schemaUrl = 'https://everymundo.github.io/registry/playground/setup-schema.json'
    const endpoint = new httpClient.GetEndpoint(schemaUrl, { 'Accept-Encoding': 'gzip' })
    const res = await endpoint.get().catch(e => e)

    if (res instanceof Error) {
      throw new Error(`Error fetching schema ${schemaUrl}: ${res.message}`)
    }

    schema = parseJson(res.buffer)

    fs.writeFile(tempFilePath, JSON.stringify(schema))
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
        Object.fromEntries(validate.errors.map((v, i) => [`Error #${i + 1}`, v])),
        { depth: 10, colors: true, compact: true }
      ), '\n'
    )

    console.error('Schema validation: \u274C ERROR')
  }

  console.log('Schema validation: \u2705 PASS')
}

const cacheIsTooOld = (stat, maxAge = 864000) => stat == null || Date.now() - stat.ctime.getTime() > maxAge

async function getRemoteSettings (identity, account) {
  const moduleId = modLib.getModuleId()
  const tempFilePath = path.join(os.tmpdir(), `registry-remote-settings-for-${moduleId}-cached.json`)
  const [{ value: stat }, { value: buffer }] = await Promise.allSettled([
    fs.stat(tempFilePath),
    fs.readFile(tempFilePath)
  ])

  let remoteSettings = parseJson(buffer)

  if (stat instanceof Error || remoteSettings instanceof Error || cacheIsTooOld(stat, 300_000)) {
    const params = { moduleId }
    remoteSettings = await registryApis.get(identity.getAccount(account), 'latest-schema', { params }).catch(e => e)

    if (remoteSettings instanceof Error) {
      throw new Error(`Error fetching latest schema: ${remoteSettings.message}`)
    }

    if (remoteSettings instanceof ErrorResponse) {
      if (remoteSettings.statusCode === 404) {
        return remoteSettings
      }

      console.error('Error fetching latest schema')
      console.error(remoteSettings.toJSON())

      process.exit(1)
    }

    fs.writeFile(tempFilePath, JSON.stringify(remoteSettings))
  }

  return remoteSettings
}

export async function validateBackwardCompatibility (setupJson, command) {
  if (setupJson == null) {
    throw new Error('setupJson is required')
  }

  if (setupJson.settings == null) {
    throw new Error('setupJson.settings is required')
  }

  if (setupJson.settings.schema == null) {
    throw new Error('setupJson.settings.schema is required')
  }

  const { /* debug = false,  */account = 'default' } = command.parent.opts()

  const remoteSettings = await getRemoteSettings(identity, account).catch(e => e)

  if (remoteSettings instanceof Error) {
    console.error(remoteSettings)

    throw new Error('Error fetching latest schema')
  }

  if (remoteSettings.statusCode === 404) {
    console.error('No remote settings found')

    return console.log('Schema compatible: \uD83D\uDEAB IGNORED')
  }

  const check = checkBackwardCompatibility(remoteSettings.schema.properties, setupJson.settings.schema.properties)

  if (check.errors.length > 0) {
    console.error(
      util.inspect(
        Object.fromEntries(check.errors.map((v, i) => [`Error #${i + 1}`, v])),
        { depth: 10, colors: true, compact: true }
      ), '\n'
    )

    throw new Error('Schema compatible: ERROR')
  }

  console.log('Schema compatible: PASS')
}
