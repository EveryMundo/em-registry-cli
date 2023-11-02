import identity from '../../lib/identity.mjs'

export default whoami
export function whoami (options, command) {
  const { account = 'default' } = command.parent.opts()
  const id = identity.getAccount(account)

  if (id.accountId === '' || id.userId === '') {
    return console.log('Configuration not found. Please run the configure command first.')
  }

  console.log(`Partner: ${id.accountId}, User: ${id.userId}`)
}
