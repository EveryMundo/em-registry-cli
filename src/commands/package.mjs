import FS from 'node:fs'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import childProcess from 'node:child_process'
import yazl from 'yazl'

import modLib from '../../lib/module-id.mjs'
import { push } from './push.mjs'

// package is a reserved word in nodejs hence the underscore
export default _package
export async function _package (options, command) {
  // const { debug = false, account = 'default' } = command.parent.opts()
  const mod = modLib.getModule()

  if (mod.err != null) {
    if (mod.err.code === 'MODULE_NOT_FOUND' || mod.err.code === 'ENOENT') {
      console.error(`Check your em-module.json ${path.basename(mod.moduleJsonFile)}`)
      throw new Error(`Working directory ${path.dirname(mod.moduleJsonFile)} does not contain a valid ${path.basename(mod.moduleJsonFile)}`)
    }
  }

  try {
    if (options.build) {
      if (!mod.prePackCommand) {
        throw new Error('package command with --build requires em-module.prePackCommand')
      }

      console.log(`Running "${mod.prePackCommand}" ...`)
      const startTime = Date.now()
      const packResult = childProcess.execSync(mod.prePackCommand)
      const timeTaken = Date.now() - startTime
      console.log(`====\n${packResult.toString()}====\n${timeTaken / 1000} seconds\n====`)
    }
  } catch (err) {
    console.error(err.stderr.toString())

    process.exit(1)
  }

  const zipfile = new yazl.ZipFile()

  const zipFileName = 'em-module.zip'
  console.log(`creating file ${zipFileName}...`)
  const st = await fs.statfs(mod.buildDirectory).catch(e => e)
  if (st instanceof Error) {
    if (st.code === 'ENOENT') {
      console.error(`Error: build directory [${mod.buildDirectory}] does not exist! Check your em-module.json`)
    } else {
      console.error(`Error: ${st.message}`)
    }

    process.exit(1)
  }

  await addDirectory(mod.buildDirectory, zipfile)

  await saveZipFile(zipFileName, zipfile)

  if (options.push) {
    await push(zipFileName, {}, command)
  }
}

export async function addDirectory (dirpath, zipfile) {
  const dir = await fs.opendir(dirpath)
  const entries = dir.entries()

  for await (const entry of entries) {
    const filePath = path.join(dirpath, entry.name)
    const stats = await fs.lstat(filePath)

    if (stats.isFile()) {
      const entryName = filePath.slice(filePath.indexOf(path.sep) + 1)
      console.log(`adding ${filePath} as ${entryName}`)
      zipfile.addFile(`${filePath}`, entryName)
    } else if (stats.isDirectory()) {
      await addDirectory(filePath, zipfile)
    }
  }
}

const saveZipFile = (zipFileName, zipfile) => new Promise((resolve) => {
  zipfile.end(() => zipfile.outputStream.pipe(FS.createWriteStream(zipFileName))
    .once('close', () => {
      console.log(`file ${zipFileName} has been created`)

      resolve(zipFileName)
    }))
})
