const path = require('path')
const { exit } = require('process')

const currentDirectory = process.cwd()
const moduleJsonFile = path.join(currentDirectory, 'em-module.json')

const getModule = () => {
  let mod

  try {
    mod = require(moduleJsonFile)
  } catch (e) {
    mod = {
      moduleId: null
    }
  }

  return mod
}

const getModuleId = (exitOnError = true) => {
  if (process.env.EM_MODULE_ID != null) {
    return process.env.EM_MODULE_ID
  }

  const mod = getModule()

  if (mod.moduleId != null) {
    return require(moduleJsonFile).moduleId
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

module.exports = { getModule, getModuleId, saveModuleId }
