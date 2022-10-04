#!/usr/bin/env node
const crypto = require('crypto')

const httpClient = require('@everymundo/http-client')

const getFileHash = (fileBuffer) => {
  crypto.createHash('md5').update(fileBuffer).digest('hex')
}

async function requestUploadUrl (identity, moduleId, fileBuffer) {
  const url = 'https://registry.everymundo.work/deployer/pre-signer'
  const headers = {
    'x-api-key': identity.userApiKey,
    authorization: `JSON ${JSON.stringify({ a: identity.accountId, u: identity.userId, p: identity.userApiKey })}`,
    'content-type': 'application/json'
  }

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
