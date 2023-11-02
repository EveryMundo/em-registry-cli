import inquirer from 'inquirer'

import identity from '../../lib/identity.mjs'
import modLib from '../../lib/module-id.mjs'
import registryApis from '../../lib/registry-webapis.mjs'

export default promote
export async function promote (options, command) {
  const { debug = false, account = 'default' } = command.parent.opts()
  const mod = modLib.getModule()

  if (mod.moduleId == null) {
    console.error('Missing Module!')
    if (debug) console.error(mod)

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
    moduleId: mod.moduleId,
    deploymentId: answers.deploymentId
  }

  const response = await registryApis.post(identity.getAccount(account), 'qa-request', postData)

  console.log({ response })
}
