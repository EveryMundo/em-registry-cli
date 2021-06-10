# em-registry-cli
CLI for the EM Registry

## Instalation
```sh
npm i -g @everymundo/em-registry-cli
```

## Credentials

Just like the awscli you can have different profiles/accounts in your `$HOME/.everymundo/registry.json` file

### Configure the default account
```sh
em-registry-cli configure

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
em-registry-cli configure -a test
# or
em-registry-cli configure --account test

? What's the accountId [] abc
? What's the userId  [] u100
? What's the userApiKey [...] [hidden]
```

## Modules

### Initialize an existing module
In the case of having an existing project without an `em-module.json` file in the project your see the following message when running the *em-registry-cli*

```
em-registry-cli init

? What's the moduleId (m100)

{
  "moduleId": "m200"
}
```