#!/usr/bin/env node
const fs = require('fs').promises
// const util = require('util')
const FormData = require('form-data')

const { requestUploadUrl } = require('../lib/request-upload-url')
const { getModuleId } = require('../lib/get-module-id')
const identity = require('../lib/identity')

const submit = (form, url) => new Promise((resolve, reject) => {
  form.submit(url, (err, res) => {
    if (err) {
      return reject(err)
    }

    const buffs = []
    res.on('data', (chunk) => buffs.push(chunk))
    res.on('end', () => {
      console.log({ buffs })
      resolve(Buffer.concat(buffs))
    })

    res.on('error', reject)
  })
})

const uploadArtifact = async (uploadURL, compressedFileName, compressedFileBuffer) => {
  const { url, fields } = uploadURL
  const form = new FormData()
  Object.entries(fields).forEach(([field, value]) => {
    form.append(field, value)
  })

  form.append('file', compressedFileBuffer)

  const res = await submit(form, url)

  console.log({ res: res.toString() })
}

async function main (compressedFileName, moduleId) {
  const data = await fs.readFile(compressedFileName)

  let urlResponse
  try {
    urlResponse = await requestUploadUrl(identity, moduleId, data)
  } catch (e) {
    if (e.stats == null) {
      throw e
    }

    return console.error(e.stats.responseText)
  }

  await uploadArtifact(urlResponse.uploadURL, compressedFileName, data)

  console.log(`Preview URL: ${urlResponse.previewUrl}
  `)
}

function printUsage (exitCode = 1) {
  console.log(`
You must pass the zip file as the first argument
e.g:
  em-registry-cli my-package.zip
  `)

  if (exitCode != null) {
    process.exit(exitCode)
  }
}

if (require.main === module) {
  if (process.argv[2] == null) {
    printUsage()
  }
  main(process.argv[2], getModuleId())
}
