import identity from '../../lib/identity.mjs'
import registryApis from '../../lib/registry-webapis.js'

export default listModules
export async function listModules (opts, command) {
  const { debug = false, account = 'default' } = command.parent.opts()
  console.log({ opts })
  const response = await registryApis.get(identity.getAccount(account), 'list-modules', debug)

  console.table(response.map(({ _id, name, forTenants, createdBy }) => ({ _id, name, forTenants, createdBy })))
}
