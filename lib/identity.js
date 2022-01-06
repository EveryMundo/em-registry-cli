const path = require('path')
const fs = require('fs')

const { env } = process
const identityDirectory = path.join(env.HOME || env.USERPROFILE, '.everymundo')
const identityFile = path.join(identityDirectory, 'registry.json')

function saveIdentitySync (identity) {
  if (!fs.existsSync(identityDirectory)) {
    fs.mkdirSync(identityDirectory)
  }

  require('fs').writeFileSync(identityFile, JSON.stringify(identity, null, 2))
}

function readIdentity () {
  try {
    return require(identityFile)
  } catch (e) {
    const initialIdentity = {
      accounts: {
        default: {
          accountId: '',
          userId: '',
          userApiKey: ''
        }
      }
    }

    saveIdentitySync(initialIdentity)

    return initialIdentity
  }
}

// const identity = require(path.join(process.env.HOME, '.everymundo', 'registry.json'))
const identity = readIdentity()

// @TODO check for identity file's integrity

function getAccount (account = 'default', ignoreEnvVars = true) {
  if (!(account in identity.accounts)) {
    throw new Error(`Account [${account}] not found`)
  }

  const identityFound = identity.accounts[account]

  const accountIdentity = {
    accountId: (ignoreEnvVars && env.EM_ACCOUNT_ID) || identityFound.accountId,
    userId: (ignoreEnvVars && env.EM_USER_ID) || identityFound.userId,
    userApiKey: (ignoreEnvVars && env.EM_API_KEY) || identityFound.userApiKey
  }

  return accountIdentity
}

async function saveAccount (accountName, accountObject) {
  const identity = readIdentity()

  identity.accounts[accountName] = accountObject

  saveIdentitySync(identity)
}

module.exports = {
  readIdentity,
  getAccount,
  saveAccount
}
