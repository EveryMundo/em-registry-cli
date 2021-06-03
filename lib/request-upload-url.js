#!/usr/bin/env node
const crypto = require('crypto')

const httpClient = require('@everymundo/http-client')

const getFileHash = (fileBuffer) => {
  crypto.createHash('md5').update(fileBuffer).digest('hex')
}

async function requestUploadUrl (identity, moduleId, fileBuffer) {
  const url = 'https://7lfthaz76j.execute-api.us-east-1.amazonaws.com/prod/registry/prod/deployer/pre-signer'
  const headers = {
    'x-api-key': identity.userApiKey,
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
