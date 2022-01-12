# CONTRIBUTING

We’re excited to onboard more engineers on our ship to conquer Proof of Personhood! Thank you for considering to contribute to our project.

Our website is found at [https://zorro.xyz/](https://zorro.xyz/), and you can join our community on [Discord](https://discord.gg/Caj283PtN4). To learn more about our mission and goals, check out our [whitepaper](https://hackmd.io/@zorro-project/zorro-whitepaper).

# Contributing Code

## Project Setup

### Accounts

1. MetaMask

    [MetaMask](https://metamask.io/index.html) is a crypto wallet & gateway to blockchain applications. You will need MetaMask to interact with the [Görli (Goerli) Test Network](https://goerli.net/), which is the test network that our application uses. Install MetaMask and get your account setup, and then change your network to the “Goerli Test Network”. You may need to change your settings to show test networks.

2. Infura

    [Infura](https://infura.io/) is a Web3 backend and Infrastructure-as-a-Service (IaaS) provider that offers a variety of tools for blockchain developers. You will need Infura to generate an API key to run our contracts locally. Create an account with Infura, and then create a project. You will need the Project ID for an environment variable in the project.

### Setting up the repository

1. Clone the repository.

```jsx
git clone https://github.com/zorro-project/zorro.git
```

1. Run “yarn install” in /starknet and /redwood/web

### Setting up StarkNet

1. Duplicate the “/starknet/.env.example” file and rename it to “/starknet/.env”.
2. Change the “INFURA_API_KEY” field to the API key (”Project ID”) from your Infura project, mentioned earlier under the Accounts section.
3. Follow the /starknet/readme.md file.

### Starting the project

1. Run “yarn dev” in /redwood. The application should be running at [http://localhost:8910/](http://localhost:8910/).


## Finding Tasks

We maintain a Kanban board [here](https://www.notion.so/28e2b02ecf064dfe9162db3360ec6643) on our Notion. If you have questions regarding tasks, please post them in the #dev channel on our Discord.

# Code of Conduct

Coming soon.

# Important Resources

Coming soon.