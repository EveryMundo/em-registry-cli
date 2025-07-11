import fs from 'node:fs/promises'
import os from 'node:os'
import FormData from 'form-data'

import identity from '../../lib/identity.mjs'
import modLib from '../../lib/module-id.mjs'
import registryApis, { ErrorResponse } from '../../lib/registry-webapis.mjs'
import { checkLatestVersion } from '../../lib/check-latest-version.mjs'

export default push
export async function push (compressedFileName, options, command) {
  const opts = command.parent.opts()
  const { debug = false, account = 'default' } = opts
  checkLatestVersion(opts).then(console.log)

  const moduleId = modLib.getModuleId()
  const data = await fs.readFile(compressedFileName)

  let urlResponse
  try {
    const id = identity.getAccount(account)
    // console.log({ id })
    const response = await registryApis.requestUploadUrl(id, moduleId, data)

    if (response instanceof ErrorResponse) {
      console.error(response.toJSON())

      process.exit(1)
    }

    urlResponse = response.data
    if (debug) console.log({ urlResponse })
  } catch (e) {
    if (e.stats == null) {
      throw e
    }

    return console.error(e.stats.responseText)
  }

  const form = new FormData()
  await uploadArtifact(os, form, urlResponse.uploadURL, compressedFileName, data)
  const { deploymentId, previewUrl } = urlResponse
  const playgroundUrl = `https://everymundo.github.io/registry/playground/?url=${(previewUrl)}`
  console.table([
    { name: 'deploymentId', value: deploymentId },
    { name: 'Preview', value: previewUrl },
    { name: 'LATEST', value: `${previewUrl.replace(deploymentId, 'LATEST')}?from=${deploymentId}` },
    { name: 'Playground', value: playgroundUrl }
  ])

  if (Array.isArray(urlResponse.tenantsPreviewUrls)) {
    for (const { tenantId, url } of urlResponse.tenantsPreviewUrls) {
      console.log(`\nPreview URL [${tenantId}]: ${url}`)
      console.log(`Playground [${tenantId}]: ${playgroundUrl}`)
    }
  }
}

const uploadArtifact = async (os, form, uploadURL, compressedFileName, compressedFileBuffer) => {
  if (os.platform() === 'darwin') {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  }

  const { url, fields } = uploadURL
  Object.entries(fields).forEach(([field, value]) => {
    form.append(field, value)
  })

  form.append('file', compressedFileBuffer)

  const res = await submit(form, url)

  console.log({ res: res.toString() })

  return res
}

const submit = (form, url) => new Promise((resolve, reject) => {
  form.submit(url, (err, res) => {
    if (err) {
      return reject(err)
    }

    const buffs = []
    res.on('data', (chunk) => { buffs.push(chunk) })
    res.on('end', () => { resolve(Buffer.concat(buffs)) })

    res.on('error', reject)
  })
})
