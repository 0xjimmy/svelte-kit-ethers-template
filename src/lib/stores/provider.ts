export const ssr = false;
import { get, writable } from 'svelte/store';
import { ethers } from 'ethers';
import WalletConnectProvider from '@walletconnect/ethereum-provider/dist/umd/index.min.js';
import { browser } from '$app/env';

const infuraId = "YOUR_INFURA_ID";
const chainId = 1;
export const provider = writable(ethers.providers.getDefaultProvider());
export const walletAddress = writable(undefined);

provider.subscribe((_provider: any) => {
  _provider.getNetwork().then(async (network: any) => {
    if (network.chainId !== chainId) {
      _provider.jsonRpcFetchFunc('wallet_switchEthereumChain', [
        { chainId: `0x${chainId.toString(16)}` }
      ]).catch(() => {
        try {
          _provider.jsonRpcFetchFunc('wallet_addEthereumChain', [
            {
              chainId: `0x${chainId.toString(16)}`,
              chainName: 'Ethereum Dev',
              nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['http://localhost:8545'], // Replace with your own node URL
              blockExplorerUrls: ['https://etherscan.com']
            }
          ]);
        } catch (error) {
          console.log('Error Setting Network', error);
        }
      });
    }
  })
});

export const connectMetamask = () => new Promise((resolve, reject) => {
  if (!window['ethereum']) reject('No injected provider found');
  else {
    try {
      window['ethereum'].request({ method: 'eth_requestAccounts' }).then(() => {
        const injectedProvider = new ethers.providers.Web3Provider(window['ethereum']);
        provider.set(injectedProvider);
        injectedProvider
          .getSigner()
          .getAddress()
          .then((address: string) => {
            walletAddress.set(address);
            if (get(connected) && sessionStorage['connectType'] === 'walletconnect') {
              const providerInstance = new WalletConnectProvider({ infuraId });
              providerInstance.disconnect();
            };
            connected.set(true);
            sessionStorage['connectType'] = 'metamask';
            resolve(true);
          });
      });
    } catch (error) {
      reject(error);
    }
  }
});

export const connectWalletConnect = () => new Promise(async (resolve, reject) => {
  try {
    const providerInstance = new WalletConnectProvider({ infuraId });
    await providerInstance.enable();
    const walletConnectProvider = new ethers.providers.Web3Provider(providerInstance);
    provider.set(walletConnectProvider);
    walletConnectProvider
      .getSigner()
      .getAddress()
      .then((address: string) => {
        walletAddress.set(address);
        connected.set(true);
        sessionStorage['connectType'] = 'walletconnect';
        resolve(true);
      });
  } catch (error) {
    reject(error)
  }
});

let _connected = false;

if (browser) {
  _connected = JSON.parse(sessionStorage.getItem('connected')) || false;
  if (_connected && sessionStorage.getItem('connectType') === 'metamask') {
    if (!window['ethereum'].selectedAddress) _connected = false;
    if (_connected) connectMetamask();
  }
  if (_connected && sessionStorage.getItem('connectType') === 'walletconnect') {
    const providerInstance = new WalletConnectProvider({ infuraId });
    if (!providerInstance.connected) _connected = false;
    if (_connected) connectWalletConnect();
  }
}

export const connected = writable(false);
connected.subscribe((value) => {
  if (browser) sessionStorage['connected'] = JSON.stringify(value)
})

export const disconnect = () => {
  connected.set(false);
  walletAddress.set(undefined);
  provider.set(ethers.providers.getDefaultProvider());
}

