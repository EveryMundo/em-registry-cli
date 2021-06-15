#!/usr/bin/env node
const { promises: fs } = require('fs')
const { Command } = require('commander')
const FormData = require('form-data')

const { requestUploadUrl } = require('../lib/request-upload-url')
const modLib = require('../lib/get-module-id')
const identity = require('../lib/identity')

const submit = (form, url) => new Promise((resolve, reject) => {
  form.submit(url, (err, res) => {
    if (err) {
      return reject(err)
    }

    const buffs = []
    res.on('data', (chunk) => buffs.push(chunk))
    res.on('end', () => {
      console.log({ buffs })
      resolve(Buffer.concat(buffs))
    })

    res.on('error', reject)
  })
})

const uploadArtifact = async (uploadURL, compressedFileName, compressedFileBuffer) => {
  const { url, fields } = uploadURL
  const form = new FormData()
  Object.entries(fields).forEach(([field, value]) => {
    form.append(field, value)
  })

  form.append('file', compressedFileBuffer)

  const res = await submit(form, url)

  console.log({ res: res.toString() })
}

async function publish (compressedFileName, moduleId, account = 'default') {
  const data = await fs.readFile(compressedFileName)

  let urlResponse
  try {
    const id = identity.getAccount(account)
    // console.log({ id })
    urlResponse = await requestUploadUrl(id, moduleId, data)
  } catch (e) {
    if (e.stats == null) {
      throw e
    }

    return console.error(e.stats.responseText)
  }

  await uploadArtifact(urlResponse.uploadURL, compressedFileName, data)

  console.log(`Preview URL: ${urlResponse.previewUrl}
  `)
}

async function configure (account = 'default') {
  // let urlResponse
  let id
  try {
    id = identity.getAccount(account)
  } catch (e) {
    if (e.message === `Account [${account}] not found`) {
      id = {
        accountId: '',
        userId: '',
        userApiKey: ''
      }
    }
  }
  const inquirer = require('inquirer')
  // const chalkPipe = require('chalk-pipe')

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

async function initialize (account = 'default') {
  // let urlResponse
  const mod = modLib.getModule()

  const inquirer = require('inquirer')
  // const chalkPipe = require('chalk-pipe')

  const questions = [
    {
      type: 'input',
      name: 'moduleId',
      message: 'What\'s the moduleId',
      default () { return mod.moduleId },
      validate (value) {
        const pass = /^\w{3,12}$/.test(value)

        return pass || 'Please enter a valid moduleId with a valid string between 3 and 12 chars'
      }
    }
  ]

  const answers = await inquirer.prompt(questions)

  mod.moduleId = answers.moduleId
  modLib.saveModuleId(mod)
}

function main () {
  const program = new Command()

  program.version(require('../package').version)
  program.option('-a, --account <accountName>', 'The name of the configured account')

  program
    .command('publish <zipfile>')
    .description('Publishes your Everymundo Module')
    .action((zipfile) => {
      publish(zipfile, modLib.getModuleId(), program.opts().account)
        .catch((e) => {
          console.error(program.opts().debug ? e : e.message)

          process.exit(1)
        })
    })

  program
    .command('init')
    .description('initializes a module with its id')
    // .option('-a, --account <accountName>', 'The name of the configured account')
    .action(() => {
      initialize(program.opts().account)
        .catch((e) => {
          console.error(program.opts().debug ? e : e.message)

          process.exit(1)
        })
    })

  program
    .command('configure')
    .description('configures credentials')
    .option('-a, --account <accountName>', 'The name of the configured account')
    .action(() => {
      configure(program.opts().account)
        .catch((e) => {
          console.error(program.opts().debug ? e : e.message)

          process.exit(1)
        })
    })

  program.parse(process.argv)
}

if (require.main === module) {
  main()
}
