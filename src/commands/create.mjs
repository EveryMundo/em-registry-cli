import inquirer from 'inquirer'

import identity from '../../lib/identity.mjs'
import modLib from '../../lib/module-id.mjs'
import registryApis, { ErrorResponse } from '../../lib/registry-webapis.mjs'

export default createModule
export async function createModule (options, command) {
  const { debug = false, account = 'default' } = command.parent.opts()
  const mod = modLib.getModule()

  if (mod.moduleId != null) {
    console.error('It seems you already have a project in this directory. Create command aborted!')
    console.error(mod)

    process.exit(1)
  }

  const questions = [
    {
      type: 'input',
      name: 'name',
      message: 'Module name',
      validate (value) {
        const pass = /^\w[-\w\s]{2,48}$/.test(value)

        return pass || 'Please enter a valid Module Name with a valid string between 2 and 48 chars'
      }
    },
    {
      type: 'checkbox',
      name: 'industries',
      message: 'What industries are you building this module for?',
      choices: [
        { name: 'Airlines', value: 'A' },
        { name: 'Hotels', value: 'H' },
        { name: 'Packages', value: 'P' }
      ],
      validate (answer) {
        if (answer.length === 0) {
          return 'You must choose at least one industry.'
        }

        return true
      }
    },
    {
      type: 'input',
      name: 'tenantIds',
      message: 'What companies are you building this module for?',
      default () { return '*' },
      validate (value) {
        const pass = value === '*' || /^(?:(:?\w{2,4})\s)*(:?\w{2,4})$/.test(value)

        return pass || 'Please enter *, one code or a list of codes separated by spaces. e.g.: AA BB C8 D2'
      }
    },
    {
      type: 'input',
      name: 'buildDirectory',
      message: 'What\'s the build directory?',
      default () { return 'build' },
      validate (value) {
        const pass = /^\w{3,12}$/.test(value)

        return pass || 'Please enter a valid build directory name with a valid string between 3 and 12 chars'
      }
    },
    {
      type: 'input',
      name: 'prePackCommand',
      message: 'What\'s the pre package command?',
      default () { return 'npm run build' },
      validate (value) {
        const regexp = /^\w([\w\s]{1,64})*?$/
        const pass = regexp.test(value)

        if (debug) {
          console.log({ debug, value, regexp })
        }

        return pass || 'Please enter a valid pre package command'
      }
    }
  ]

  const answers = await inquirer.prompt(questions)

  if (answers.tenantIds.match(/^(?:[A-Za-z0-9]{2,4}\s*?)+$/)) {
    answers.tenantIds = answers.tenantIds.trim().split(/\s+/).map(_ => _.toUpperCase()).sort()
  }

  console.log({ answers })

  const finalAnswer = await inquirer.prompt([{
    type: 'input',
    name: 'correct',
    message: 'Do you confirm all your answers are correct? (yes|no)',
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

  const response = await registryApis.post(identity.getAccount(account), 'create-module', answers)

  if (response instanceof ErrorResponse) {
    console.error({ status: response.statusCode, data: response.data ?? response.rawResponse })

    process.exit(1)
  }

  const modObject = {
    moduleId: response.data.module._id,
    ...answers
  }

  modLib.saveModuleId(modObject)

  console.log(response.data)
}
