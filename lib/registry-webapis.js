#!/usr/bin/env node
const crypto = require('crypto')
const httpClient = require('@everymundo/http-client')

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
  ['qa-request', { suffix: 'qa/request', method: 'post' }],
  ['list-modules',  { suffix: 'modules', method: 'get' }]
])

const getUrl = (name) => {
  if (!suffixes.has(name)) {
    throw new Error(`Invalid apiName ${name}`)
  }

  return registryPrefix == null
    ? `${registryDomain}/${suffixes.get(name).suffix}`
    : `${registryDomain}/${registryPrefix}/${suffixes.get(name).suffix}`
}

/* eslint-enable no-multi-spaces */
const getHeaders = (identity) => ({
  'x-api-key': identity.userApiKey,
  authorization: `JSON ${JSON.stringify({ a: identity.accountId, u: identity.userId, p: identity.userApiKey })}`,
  'content-type': 'application/json'
})

const getFileHash = (fileBuffer) => crypto.createHash('md5').update(fileBuffer).digest('hex')

async function requestUploadUrl (identity, moduleId, fileBuffer) {
  const url = `${registryDomain}/${registryPrefix}/deployer/pre-signer`
  const headers = getHeaders(identity)

  const endpoint = new httpClient.PostEndpoint(url, headers)
  const data = {
    md5Hash: getFileHash(fileBuffer),
    accountId: identity.accountId,
    userId: identity.userId,
    moduleId
  }

  const result = await httpClient.post(endpoint, data)

  return JSON.parse(result.responseBuffer)
}

async function post (identity, apiName, data) {
  const url = getUrl(apiName)
  const headers = getHeaders(identity)

  const endpoint = new httpClient.PostEndpoint(url, headers)

  const result = await httpClient.post(endpoint, data).catch(error => error)

  if (result instanceof Error) {
    console.error(result)
  }

  return JSON.parse(result.responseBuffer)
}

async function get (identity, apiName, debug = false) {
  const url = getUrl(apiName)
  const headers = getHeaders(identity)

  const endpoint = new httpClient.GetEndpoint(url, headers)

  const result = await httpClient.get(endpoint)
  if (debug) {
    console.log(result)
  }

  return JSON.parse(result.responseBuffer)
}

module.exports = { requestUploadUrl, post, get }
