import inquirer from 'inquirer'

import identity from '../../lib/identity.mjs'
import modLib from '../../lib/module-id.mjs'
import registryApis, { ErrorResponse } from '../../lib/registry-webapis.mjs'

function getModuleId (options) {
  if (options.module != null) return options.module

  return modLib.getModule().moduleId
}

export default promote
export async function promote (options, command) {
  const { debug = false, account = 'default' } = command.parent.opts()

  const moduleId = getModuleId(options)
  if (moduleId == null) {
    const err = new Error('Missing Module ID')
    if (debug) console.error(err); else console.error(err.message)

    process.exit(1)
  }

  const deploymentIdRegExp = /^\d+$/
  const optidTestPassed = deploymentIdRegExp.test(options.id)
  if (options.id == null || !optidTestPassed) {
    console.log(`Invalid deployment id [ ${options.id} ]`)
  }

  const questions = (options.id !== null && optidTestPassed)
    ? []
    : [{
        type: 'input',
        name: 'deploymentId',
        message: 'Deployment ID',
        validate (value) {
          const pass = deploymentIdRegExp.test(value)

          return pass || 'Please enter a valid deployment id'
        }
      }]

  const answers = await inquirer.prompt(questions)
  if (answers.deploymentId == null) answers.deploymentId = options.id

  console.log('Deployment ID: ', answers.deploymentId || options.id)

  const finalAnswer = (options.yes)
    ? { correct: 'yes' }
    : await inquirer.prompt([{
      type: 'input',
      name: 'correct',
      message: 'Are you sure you want to promote this deployment id? (yes|no)',
      default () { return 'no' },
      validate (value) {
        const regexp = /^(?:yes|no)$/
        const pass = regexp.test(value.toLowerCase())

        return pass || 'Please answer yes or no'
      }
    }])

  console.log({ finalAnswer })
  if (finalAnswer.correct.toLowerCase() === 'no') {
    return console.log('Ok! Try again later')
  }

  const postData = {
    moduleId,
    deploymentId: answers.deploymentId
  }

  const response = await registryApis.post(identity.getAccount(account), 'qa-request', postData)

  if (response instanceof ErrorResponse) {
    console.error(response.toJSON())

    process.exit(1)
  }

  console.log({ status: response.statusCode, inQueue: response.data })
}
