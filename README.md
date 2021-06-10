# em-registry-cli
CLI for the EM Registry

## Instalation
```sh
npm i -g @everymundo/em-registry-cli
```

## Configure your credentials

Just like the awscli you can have different profiles/accounts in your `$HOME/.everymundo/registry.json` file

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

### Configure the default account
```sh
em-registry-cli configure

? What's the accountId [] abc
? What's the userId  [] u100
? What's the userApiKey [...] [hidden]
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
## Create a module

```
em-registry-cli create-module
```