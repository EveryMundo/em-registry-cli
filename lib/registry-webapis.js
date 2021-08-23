#!/usr/bin/env node
const httpClient = require('@everymundo/http-client')

const { env } = process
const registryDomain = env.REGISTRY_DOMAIN || 'https://q4tdauppu2.execute-api.us-east-1.amazonaws.com'
const registryPrefix = env.REGISTRY_PREFIX || 'prod/registry/prod'

const suffixes = new Map([
  ['pre-signer',    { suffix: '/deployer/pre-signer', method: 'post' }],
  ['create-module', { suffix: '/deployer/pre-signer', method: 'post' }]
])
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

module.exports = { requestUploadUrl }
