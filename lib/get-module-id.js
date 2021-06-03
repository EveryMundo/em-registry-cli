const path = require('path')
const { exit } = require('process')

const getModuleId = () => {
  if (process.env.EM_MODULE_ID != null) {
    return process.env.EM_MODULE_ID
  }

  const currentDirectory = process.cwd()
  const moduleJsonFile = path.join(currentDirectory, 'em-module.json')

  try {
    return require(moduleJsonFile).moduleId
  } catch (e) {
    console.error(`ERROR reading em-module.json from current directory '${currentDirectory}'`)
    console.error('Make sure you are in the root directory of an em-module project?')

    exit(1)
  }
}

module.exports = { getModuleId }
