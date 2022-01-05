#!/usr/bin/env node
const httpClient = require('@everymundo/http-client')

const { env } = process
const registryDomain = env.REGISTRY_DOMAIN || 'https://q4tdauppu2.execute-api.us-east-1.amazonaws.com'
const registryPrefix = env.REGISTRY_PREFIX || 'prod/registry/prod'

/* eslint-disable no-multi-spaces */
const suffixes = new Map([
  ['pre-signer',    { suffix: 'deployer/pre-signer', method: 'post' }],
  ['create-module', { suffix: 'modules', method: 'post' }],
  ['list-modules', { suffix: 'modules', method: 'get' }]
])

const getUrl = (name) => {
  if (!suffixes.has(name)) {
    throw new Error(`Invalid apiName ${name}`)
  }

  return `${registryDomain}/${registryPrefix}/${suffixes.get(name).suffix}`
}

/* eslint-enable no-multi-spaces */
const getHeaders = (identity) => ({
  'x-api-key': identity.userApiKey,
  authorization: `JSON ${JSON.stringify({ a: identity.accountId, u: identity.userId, p: identity.userApiKey })}`,
  'content-type': 'application/json'
})

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

  const result = await httpClient.post(endpoint, data)

  return JSON.parse(result.responseBuffer)
}

async function get (identity, apiName) {
  const url = getUrl(apiName)
  const headers = getHeaders(identity)

  const endpoint = new httpClient.GetEndpoint(url, headers)

  const result = await httpClient.get(endpoint)

  return JSON.parse(result.responseBuffer)
}

module.exports = { requestUploadUrl, post, get }
