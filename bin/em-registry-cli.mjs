#!/usr/bin/env node
import fs from 'node:fs/promises'
import url from 'node:url'
import { Command } from 'commander'

import packJson from '../lib/package-json.mjs'
import { commands } from '../src/commands/all.mjs'

function uncaught (program, err, origin) {
  if (program.opts().debug) {
    console.error(err, { origin })
  } else {
    console.error(err.message)
  }

  process.exit(1)
}

function main (process) {
  process.env.EMHC_LOG_LEVEL = 'silent'
  const program = new Command()

  process
    .on('uncaughtException', (err, origin) => uncaught(program, err, origin))
    .on('unhandledRejection', (reason, promise) => uncaught(program, reason, promise))

  program.version(packJson.version)
  program.option('-a, --account <accountName>', 'The name of the configured account')
  program.option('-d, --debug', 'Prints more information about the current process')

  program
    .command('push <zipfile>')
    .description('Pushes your Everymundo Module')
    .action(commands.push)

  program
    .command('init')
    .description('initializes a module with its id')
    .action(commands.init)

  program
    .command('configure')
    .description('configures credentials')
    .action(commands.configure)

  program
    .command('create')
    .description('creates a module on our servers')
    .action(commands.create)

  program
    .command('list-modules')
    .description('List available modules for you')
    .option('--mine', 'By default all modules are listed, this limits the list do the ones created by yourself')
    .action(commands.listModules)

  program
    .command('package')
    .description('creates a package file using the pre-defined command')
    .option('-b, --build', 'Runs configured build command (e.g: npm build)')
    .option('-p, --push', 'Pushes the generaged package')
    .action(commands.package)

  program
    .command('promote')
    .description('puts a specific deployment in a queue for QA to promote it to a prod version')
    .option('-i, --id <deploymentId>', 'The deployment id to be analyzed')
    .option('-y, --yes', 'Automatically answers yes to the promotion of a module')
    .action(commands.promote)

  program
    .command('validate')
    .description('validates the setup.json file using the schema in @everymundo/registry-setup-json-spec')
    .action(commands.validate)

  program
    .command('whoami')
    .description('prints the current Partner and userId')
    .action(commands.whoami)

  program.parse(process.argv)
}

if (await isThisModuleMain(process, fs)) {
  main(process)
}

async function isThisModuleMain (process, fs) {
  const argv1 = process.argv[1]
  const stat = await fs.lstat(argv1).catch(e => e)

  if (stat instanceof Error) {
    return false
  }

  const fileUrl = url.pathToFileURL(argv1).href
  if (stat.isSymbolicLink()) {
    return import.meta.url === `file://${await fs.realpath(argv1)}`
  }

  return import.meta.url === fileUrl
}

export default {
  main
}
