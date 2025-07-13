import path from 'path'
import fs from 'fs'

const { env } = process
const identityDirectory = path.join(env.HOME || env.USERPROFILE, '.everymundo')
const identityFile = path.join(identityDirectory, 'registry.json')

function saveIdentitySync (identity) {
  if (!fs.existsSync(identityDirectory)) {
    fs.mkdirSync(identityDirectory)
  }

  const jsonString = JSON.stringify(identity, null, 2)

  fs.writeFileSync(identityFile, jsonString)
}

class Account {
  accountId = ''
  userId = ''
  userApiKey = ''
}

class Identity {
  /** @type {Map<string, Account>} */
  accounts = new Map()

  constructor () {
    this.accounts.set('default', new Account())
  }

  toJSON () {
    return {
      accounts: Object.fromEntries(this.accounts)
    }
  }

  static fromObject (o) {
    const identity = new this()
    identity.accounts = new Map(Object.entries(o.accounts))

    return identity
  }
}

/**
 *
 * @returns {Identity} identity
 */
function readIdentity () {
  try {
    const o = JSON.parse(fs.readFileSync(identityFile))
    return Identity.fromObject(o)
  } catch (e) {
    const initialIdentity = new Identity()

    saveIdentitySync(initialIdentity)

    return initialIdentity
  }
}

// const identity = require(path.join(process.env.HOME, '.everymundo', 'registry.json'))
export const identity = readIdentity()

// @TODO check for identity file's integrity

function getAccount (account = 'default') {
  // if (!(account in identity.accounts)) {
  const identityFound = identity.accounts.get(account)
  if (identityFound == null) {
    throw new Error(`Account [${account}] not found`)
  }

  const accountIdentity = {
    accountId: env.EM_ACCOUNT_ID || identityFound.accountId,
    userId: env.EM_USER_ID || identityFound.userId,
    userApiKey: env.EM_API_KEY || identityFound.userApiKey
  }

  return accountIdentity
}

/**
 *
 * @param {string} accountName
 * @param {Account} accountObject
 */
async function saveAccount (accountName, accountObject) {
  const identity = readIdentity()

  // identity.accounts[accountName] = accountObject
  identity.accounts.set(accountName, accountObject)

  saveIdentitySync(identity)
}

export default {
  Account,
  Identity,
  identity,
  readIdentity,
  getAccount,
  saveAccount
}
