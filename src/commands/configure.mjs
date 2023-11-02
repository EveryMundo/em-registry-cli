import inquirer from 'inquirer'

import identity from '../../lib/identity.mjs'

export default configure
export async function configure (options, command) {
  const { account = 'default' } = command.parent.opts()
  const id = getId(account)

  const questions = [
    {
      type: 'input',
      name: 'accountId',
      message: 'What\'s the accountId',
      default () { return id.accountId },
      validate (value) {
        const pass = /^\w{3,12}$/.test(value)

        return pass || 'Please enter a valid accountId with a valid string between 3 and 12 chars'
      }
    },
    {
      type: 'input',
      name: 'userId',
      message: 'What\'s the userId',
      default () { return id.userId },
      validate (value) {
        const pass = /^\w{3,12}$/.test(value)

        return pass || 'Please enter a valid userId with a valid string between 3 and 12 chars'
      }
    },
    {
      type: 'password',
      name: 'userApiKey',
      message: `What's the userApiKey [...${id.userApiKey.substr(-3)}]`,
      default () { return id.userApiKey },
      validate (value) {
        const pass = /^\w{48,64}$/.test(value)

        return pass || 'Please enter a valid userApiKey with a valid string between 48 and 64 chars'
      }
    }
  ]

  const answers = await inquirer.prompt(questions)

  identity.saveAccount(account, answers)
}

function getId (account = 'default') {
  try {
    return identity.getAccount(account)
  } catch (e) {
    if (e.message === `Account [${account}] not found`) {
      return {
        accountId: '',
        userId: '',
        userApiKey: ''
      }
    }
  }
}
