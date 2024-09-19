import identity from '../../lib/identity.mjs'
import registryApis, { ErrorResponse } from '../../lib/registry-webapis.mjs'

export default listModules
export async function listModules (opts, command) {
  const { debug = false, account = 'default' } = command.parent.opts()

  const response = await registryApis.get(identity.getAccount(account), 'list-modules', debug)

  if (response instanceof ErrorResponse) {
    console.error({ status: response.statusCode, data: response.data ?? response.rawResponse.toString() })

    process.exit(1)
  }

  console.table(response.data
    .sort((a, b) => a._id.localeCompare(b._id))
    .map(({ _id, name, forTenants, industries, createdBy }) => ({ _id, name, forTenants, industries: industries.join(), createdBy })))
}
