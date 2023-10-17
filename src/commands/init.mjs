import inquirer from 'inquirer'

import modLib from '../../lib/get-module-id.js'

export default initialize
export async function initialize (options, command) {
  // let urlResponse
  // const { account = 'default' } = command.parent.opts()
  const mod = modLib.getModule()

  const questions = [
    {
      type: 'input',
      name: 'moduleId',
      message: 'What\'s the moduleId',
      default () { return mod.moduleId },
      validate (value) {
        const pass = /^\w[-\w]{2,11}\w$/.test(value)

        return pass || 'Please enter a valid moduleId with a valid string between 3 and 12 chars'
      }
    }
  ]

  const answers = await inquirer.prompt(questions)

  mod.moduleId = answers.moduleId
  modLib.saveModuleId(mod)
}
