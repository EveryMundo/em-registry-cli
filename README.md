# registry
CLI for the EM Registry

## Instalation
```sh
npm i -g @everymundo/em-registry-cli
```

## Credentials

Just like the awscli you can have different profiles/accounts in your `$HOME/.everymundo/registry.json` file

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
At the moment we are only publishing a zipfile with the content of your transpile (preferred) module with the *registry*

An temporary requirement is an index.html file that loads your module. This requirement will be removed soon and we'll generate such file.

The flow could be something like this:

```sh
npm run build

cd dist # or cd build, or whatever is the output of your build

zip -r ../build.zip *

registry publish ./build.zip
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
| whoami                      | Prints the current Partner and userId                      |
| help [command]              | Display help for command                                   |
