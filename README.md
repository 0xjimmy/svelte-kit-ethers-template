# Svelte Kit Ethers Template

## Basic Setup

Install dependencies
```bash
yarn
```
Enter your own or a RPC provider endpoint for your project in the `rpcUrl` parameter of `./src/lib/config.ts` to make on-chain calls, and interact with Metamask, etc. Replace `ADD RPC PROVIDER HERE` with your RPC provider.
```js
export const NETWORKS: Network[] = [
  {
    chainId: 1,
    rpcUrl: 'ADD RPC PROVIDER HERE', // Your RPC endpoint, add here
...
```

Start development server
```bash
yarn dev
```



**Building**
Before creating a production version of your app, install an [adapter](https://kit.svelte.dev/docs#adapters) for your target environment. Then:

```bash
yarn build
```

## Features

### Wallet & Providers

After adding a list of networks in `./src/lib/config.ts`, you have access to ethers providers for each network.
```ts
import { networkProviders: { [chainId: string]: providers.JsonRpcProvider } } from '$lib/stores/provider'
```


Methods to connect wallets
* `connectMetamask` - Connect Metamask or other injected wallets
* `connectWalletConnect` - Wallet Connect Connection
* and `disconnect`

Stores for the connection information are also provided
```ts
import {
    accountChainId,
    accountProvider,
    connected,
    walletAddress
} from '$lib/stores/provider'
```
* `accountChainId` -  `{ chainId: number, supportedNetwork: boolean } ` supportedNetwork is `true` if you have provided configuration options for this network 
* `accountProvider` -  [EIP-11933](https://eips.ethereum.org/EIPS/eip-1193) compliant provider object. Generally used with ethers.providers.Web3Provider($accountProvider)
* `connected` - boolean
* `walletAddress` - Defaults to 0x0000000000000000000000000000000000000000 if not connected

### Contract State Syncing

In `src/lib/globalState.ts` is an example usage of [ether-state](https://github.com/decentralisedtech/ether-state) - A library for syncing the state of smart contracts in your frontend.
