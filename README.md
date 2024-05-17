### Wallet Watcher

[Hypotentically] I had a wallet that was hacked. I sent my hacked wallet USDC as a honeypot for the hacker to try and steal. This process instantly transfers a chain's base asset as soon as it lands in the wallet.

#### Getting Started

- Clone repo
- Run `npm i`
- Set up your variables within the `src/index.ts` file (including getting a reliable RPC connection)
- Run the code via `npm run start`

The process will run every 15 seconds by default (which is the avg. duration of an Ethereum block time)

_Yes, both `web3` and `ethers` are hardcoded versions to prevent any breaking changes in the future_
