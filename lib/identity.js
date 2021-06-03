const path = require('path')

const { env } = process
const jsonIdentity = require(path.join(process.env.HOME, '.everymundo', 'registry.json'))

module.exports = {
  accountId: env.EM_ACCOUNT_ID || jsonIdentity.accountId,
  userId: env.EM_USER_ID || jsonIdentity.userId,
  userApiKey: env.EM_API_KEY || jsonIdentity.userApiKey
}
