[![NPM version](https://img.shields.io/badge/npm-v1.0.0-red)](https://www.npmjs.com/package/@everymundo/em-registry-cli)

# registry
CLI for the EM Registry

## Installation
```sh
npm i -g @everymundo/em-registry-cli
```

## Credentials

Just like the awscli you can have different profiles/accounts in your `$HOME/.everymundo/registry.json` file

### Environment Variables
You can override configuration using environment variables:
- `EM_ACCOUNT_ID` - Override the account ID
- `EM_USER_ID` - Override the user ID
- `EM_API_KEY` - Override the API key
- `REGISTRY_DOMAIN` - Override the registry domain (defaults to `https://mods.airtrfx.com`)

### Configure the default account
```sh
registry configure

? What's the accountId [] ABCD
? What's the userId  [] user1
? What's the userApiKey [...] [hidden]
```

This will create a file like this
*$HOME/.everymundo/registry.json*
```json
{
    "accounts": {
        "default": {
            "accountId": "ABCD",
            "userId": "user1",
            "userApiKey": "ejgfj9svjirshut894u40ounw4onug395p4uu4om9v"
        }
    }
}
```

### Configure another account
```sh
registry configure -a test
# or
registry configure --account test

? What's the accountId [] abc
? What's the userId  [] u100
? What's the userApiKey [...] [hidden]
```

## Modules

### Initialize an existing module
In the case of having an existing project without an `em-module.json` file in the project your see the following message when running the *registry*

```
registry init

? What's the moduleId (m100)

{
  "moduleId": "m200"
}
```

### Publish a module

#### Option 1: Using the package command (Recommended)
If your module has an `em-module.json` file with a `buildDirectory` and optional `prePackCommand`:

```sh
# Package and push in one step
registry package --build --push

# Or package first, then push
registry package --build
registry push em-module.zip
```

#### Option 2: Manual packaging
For custom build processes:

```sh
npm run build

cd dist # or cd build, or whatever is the output of your build

zip -r ../build.zip *

registry push ./build.zip
```

The output of the publish command, when successfull, should be a preview URL of the module. Something like this:
```sh
Preview URL: https://em-registry-uploads--849481900493--us-east-1.s3.amazonaws.com/prod/ANDREZ/m201/000000340618804092/index.html
```
## Commands
| Commands                    | Description                                                |
| --------------------------- | ---------------------------------------------------------- |
| push \<zipfile>             | Pushes your Everymundo Module                              |
| init                        | Initializes a module with its id                           |
| configure                   | Configures credentials                                     |
| create                      | Creates a module on our servers                            |
| list-modules [options]      | List available modules for you                             |
| package [options]           | Creates a package file using the pre-defined command       |
| promote [options]           | Puts a specific deployment in a queue for QA to promote it |
| validate                    | Validates the setup.json file using the registry schema    |
| whoami                      | Prints the current Partner and userId                      |
| help [command]              | Display help for command                                   |

### Command Options

**Global Options:**
- `-a, --account <accountName>` - The name of the configured account
- `-d, --debug` - Prints more information about the current process

**list-modules:**
- `--mine` - By default all modules are listed, this limits the list to the ones created by yourself

**package:**
- `-b, --build` - Runs configured build command (e.g: npm build)
- `-p, --push` - Pushes the generated package

**promote:**
- `-i, --id <deploymentId>` - The deployment id to be analyzed
- `-m, --module <moduleId>` - The optional module id for promotion outside module directory
- `-y, --yes` - Automatically answers yes to the promotion of a module
