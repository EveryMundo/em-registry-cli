import crypto from 'crypto'
import httpClient from '@everymundo/http-client'
import pack from './package-json.mjs'

const tryParseJson = (str) => {
  try {
    return JSON.parse(str)
  } catch (e) {
    return e
  }
}

const { env } = process
env.MAX_RETRY_ATTEMPTS = 1
// const registryDomain = env.REGISTRY_DOMAIN || 'https://q4tdauppu2.execute-api.us-east-1.amazonaws.com'
const registryDomain = env.REGISTRY_DOMAIN || 'https://mods.everymundo.work'
const registryPrefix = env.REGISTRY_PREFIX || 'prod/registry'
// const registryPrefix = env.REGISTRY_PREFIX

/* eslint-disable no-multi-spaces */
const suffixes = new Map([
  ['pre-signer',    { suffix: 'deployer/pre-signer', method: 'post' }],
  ['create-module', { suffix: 'modules', method: 'post' }],
  ['qa-request',    { suffix: 'qa/request', method: 'post' }],
  ['list-modules',  { suffix: 'modules', method: 'get' }],
  ['latest-schema', { suffix: 'modules/$moduleId/latest-schema', method: 'get', requires: ['moduleId'] }]
])

const returnInput = input => input

const getUrl = (name, params) => {
  if (!suffixes.has(name)) {
    throw new Error(`Invalid apiName ${name}`)
  }

  const conf = suffixes.get(name)
  let url = registryPrefix == null
    ? `${registryDomain}/${conf.suffix}`
    : `${registryDomain}/${registryPrefix}/${conf.suffix}`

  if (conf.requires != null) {
    for (const required of conf.requires) {
      if (params[required] == null) {
        throw new Error(`Missing required parameter ${required}`)
      }

      url = url.replace(`$${required}`, params[required])
    }
  }

  return url
}

/* eslint-enable no-multi-spaces */
const getHeaders = (identity) => {
  const parseVersion = (v) => {
    let ix = v.indexOf('.')
    const maj = +v.slice(0, ix)
    let lx = ix + 1

    ix = v.indexOf('.', lx)
    const min = +v.slice(lx, ix)
    lx = ix + 1

    const pat = parseInt(v.slice(lx))

    return maj * 10 ** 6 + min * 10 ** 3 + pat
  }

  return {
    'x-api-key': identity.userApiKey,
    authorization: `JSON ${JSON.stringify({ a: identity.accountId, u: identity.userId, p: identity.userApiKey, v: pack.version })}`,
    'content-type': 'application/json',
    'x-cli-version': parseVersion(pack.version)
  }
}

const getFileHash = (fileBuffer) => crypto.createHash('md5').update(fileBuffer).digest('hex')

async function requestUploadUrl (identity, moduleId, fileBuffer) {
  const url = `${registryDomain}/${registryPrefix}/deployer/pre-signer`
  const headers = getHeaders(identity)

  const endpoint = new httpClient.PostEndpoint(url, headers)
  endpoint.maxRetry = 0

  const data = {
    md5Hash: getFileHash(fileBuffer),
    accountId: identity.accountId,
    userId: identity.userId,
    moduleId
  }

  const result = await httpClient.post(endpoint, data).catch(returnInput)

  if (result instanceof Error) {
    // if (opts.debug) {
    //   console.error(result)
    // }

    return new ErrorResponse(result)
  }

  return new SuccessResponse(result)
}

class ServerResponse {
  rawResponse = null
  responseHeaders = null
  statusCode = null
  responseId = null
  data = null

  constructor (result) {
    this.rawResponse = result.responseBuffer
    this.responseHeaders = result.responseHeaders
    this.statusCode = result.statusCode
    this.responseId = result.responseHeaders?.['x-response-id'] ?? 'MISSING!!!'
    const parsed = tryParseJson(result.responseBuffer)
    this.data = result.responseHeaders?.['content-type'] === 'application/json'
      ? (parsed instanceof Error ? result.responseBuffer.toString('utf8') : parsed)
      : null
  }
}

export class SuccessResponse extends ServerResponse { }
export class ErrorResponse extends ServerResponse {
  toJSON () {
    return {
      statusCode: this.statusCode,
      responseId: this.responseId,
      data: this.data ?? this.rawResponse
    }
  }
}

async function post (identity, apiName, data, opts = { params: {}, debug: false }) {
  const url = getUrl(apiName)
  const headers = getHeaders(identity)

  const endpoint = new httpClient.PostEndpoint(url, headers)
  endpoint.maxRetry = 1

  const result = await httpClient.post(endpoint, data).catch(returnInput)

  if (result instanceof Error) {
    if (opts.debug) {
      console.error(result)
    }

    return new ErrorResponse(result)
  }

  return new SuccessResponse(result)
}

async function get (identity, apiName, opts = { params: {}, debug: false }) {
  const url = getUrl(apiName, opts.params)
  const headers = getHeaders(identity)

  const endpoint = new httpClient.GetEndpoint(url, headers)
  endpoint.maxRetry = 1

  const result = await httpClient.get(endpoint).catch(returnInput)

  if (opts.debug) {
    console.log(result)
  }

  if (result instanceof Error) {
    if (opts.debug) {
      console.error(result)
    }

    return new ErrorResponse(result)
  }

  return new SuccessResponse(result)
}

export default { requestUploadUrl, post, get }
