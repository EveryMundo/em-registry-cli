#!/usr/bin/env node
import fs from 'node:fs/promises'
import { Command } from 'commander'

import packJson from '../lib/package-json.mjs'
import { commands } from '../src/commands/all.mjs'

function main (process) {
  const program = new Command()
  const args = process.argv.slice(2)
  const empty = args.length === 0 || args.includes('help') || args.includes('--help') || args.includes('-h')

  process
    .on('uncaughtException', (e, origin) => {
      console.error(program.opts().debug ? e : e.message)

      if (process.argv.includes('--debug')) {
        console.error(e, { origin })
      }

      process.exit(1)
    })
    .on('unhandledRejection', (reason, promise) => {
      console.error(reason.message)

      if (process.argv.includes('--debug')) {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason)
      }
      

      process.exit(1)
    })

  program.version(packJson.version)
  program.option('-a, --account <accountName>', 'The name of the configured account')
  program.option('-d, --debug', 'Prints more information about the current process')

  if (empty || args.includes('push')) program
    .command('push <zipfile>')
    .description('Pushes your Everymundo Module')
    // .action((zipfile, options, command) => push(zipfile, command, modLib.getModuleId()))
    .action(commands.push)

  if (empty || args.includes('init'))
  program
    .command('init')
    .description('initializes a module with its id')
    .action(commands.init)

  if (empty || args.includes('configure'))
  program
    .command('configure')
    .description('configures credentials')
    .action(commands.configure)

  if (empty || args.includes('create'))
  program
    .command('create')
    .description('creates a module on our servers')
    // .option('-a, --account <accountName>', 'The name of the configured account')
    .action(commands.create)

  if (empty || args.includes('list'))
  program
    .command('list-modules')
    .description('List available modules for you')
    // .option('-a, --account <accountName>', 'The name of the configured account')
    .option('--mine', 'By default all modules are listed, this limits the list do the ones created by yourself')
    .action(commands.listModules)

  if (empty || args.includes('package'))
  program
    .command('package')
    .description('creates a package file using the pre-defined command')
    // .option('-a, --account <accountName>', 'The name of the configured account')
    .option('-b, --build', 'Runs configured build command (e.g: npm build)')
    .option('-p, --push', 'Pushes the generaged package')
    .action(commands.package)

  if (empty || args.includes('promote'))
  program
    .command('promote')
    .description('puts a specific deployment in a queue for QA to promote it to a prod version')
    .option('-i, --id <deploymentId>', 'The deployment id to be analyzed')
    .option('-y, --yes', 'Automatically answers yes to the promotion of a module')
    .action(commands.promote)

  if (empty || args.includes('validate'))
  program
    .command('validate')
    .description('validates the setup.json file using the schema in @everymundo/registry-setup-json-spec')
    .action(commands.validate)

  // if (empty || args.includes('whoami'))
  program
    .command('whoami')
    .description('prints the current Partner and userId')
    .action(commands.whoami)

  program.parse(process.argv)
}

if (await isThisModuleMain()) {
  main(process)
  // (await import('../lib/check-latest-version.mjs')).checkLatestVersion().then(r => r && console.log(r))
}

async function isThisModuleMain () {
  const argv1 = process.argv[1]
  const stat = await fs.lstat(argv1).catch(e => e)

  if (stat instanceof Error) {
    return false
  }

  if (stat.isSymbolicLink()) {
    return import.meta.url === `file://${await fs.realpath(argv1)}`
  }

  return import.meta.url === `file://${argv1}`
}

export default {
  main
}
