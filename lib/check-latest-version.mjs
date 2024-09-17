import fs from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import httpClient from '@everymundo/http-client'
import { parseJson } from '@everymundo/json-utils'

let called = false
export async function checkLatestVersion ({ debug = false } = {}) {
  if (called) return
  called = true

  if (debug) {
    console.log('checkLatestVersion')
  }

  const npmEndpoint = 'https://registry.npmjs.org/@everymundo/em-registry-cli/latest'
  const returnError = err => err

  const [latest, current] = await Promise.all([
    httpClient.get(npmEndpoint)
      .then(res => parseJson(res.responseBuffer))
      .catch(returnError),
    fs.readFile(resolve(join(dirname(fileURLToPath(import.meta.url)), '..', 'package.json')))
      .then(parseJson)
      .catch(returnError)
  ])

  if (latest instanceof Error) {
    return `
    ========
    = There's a problem checking the latest version of @everymundo/em-registry-cli
    = Please check your internet connection
    ========`
  }

  if (current instanceof Error) {
    return `
    ========
    = There's a problem checking the curremt version of @everymundo/em-registry-cli
    = Please reinstall @everymundo/em-registry-cli
    = run:
    =   npm i -g @everymundo/em-registry-cli
    ========`
  }

  if (latest?.version !== current?.version) {
    return `
    ========
    = There's a new version of ${current.name} available
    = Latest: ${latest.version} vs Current: ${JSON.stringify(current.version)}
    = run:
    =   npm i -g @everymundo/em-registry-cli
    = to update
    ========
`
  }
}

export default { checkLatestVersion }
