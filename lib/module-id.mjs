import fs from 'node:fs'
import path from 'node:path'
import { exit } from 'node:process'

const currentDirectory = process.cwd()
const moduleJsonFile = path.join(currentDirectory, 'em-module.json')

const getModule = () => {
  try {
    const content = fs.readFileSync(moduleJsonFile)

    return JSON.parse(content)
  } catch (err) {
    return {
      moduleId: null,
      moduleJsonFile,
      err
    }
  }
}

const getModuleId = (exitOnError = true) => {
  if (process.env.EM_MODULE_ID != null) {
    return process.env.EM_MODULE_ID
  }

  const mod = getModule()

  if (mod.moduleId != null) {
    return mod.moduleId
  }

  if (exitOnError) {
    console.error(`
    ERROR reading em-module.json from current directory '${currentDirectory}'
    Make sure you are in the root directory of an em-module project?

    If you know the the id of an existing module ou can initialize this directory
    by running the following command:

    ${path.basename(process.argv[1])} init`)

    exit(1)
  }
}

function saveModuleId (moduleObject) {
  const content = JSON.stringify(moduleObject, null, 2)
  console.log(content)

  require('fs').writeFileSync(moduleJsonFile, content)
}

export default { getModule, getModuleId, saveModuleId }
