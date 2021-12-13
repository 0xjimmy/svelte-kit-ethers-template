export const ssr = false;
import { writable } from 'svelte/store';
import { ethers } from 'ethers';
import WalletConnectProvider from '@walletconnect/ethereum-provider/dist/umd/index.min.js';

const chainId = 1;
export const provider = writable(ethers.providers.getDefaultProvider());
export const walletAddress = writable(undefined);

provider.subscribe((_provider: any) => {
  _provider.getNetwork().then(async (network: any) => {
    if (network.chainId !== chainId) {
      try {
        _provider.jsonRpcFetchFunc('wallet_switchEthereumChain', [
          { chainId: `0x${chainId.toString(16)}` }
        ]);
      } catch (error) {
        if (error.code === 4902)
          try {
            _provider.jsonRpcFetchFunc('wallet_addEthereumChain', [
              {
                chainId: `0x${chainId.toString(16)}`,
                chainName: 'Ethereum Mainnet',
                nativeCurrency: 'ETH',
                rpcUrls: ['https://localhost:8545/'], // Replace with your own node URL
                blockExplorerUrls: ['https://etherscan.com']
              }
            ]);
          } catch (error) {
            console.log('Error Setting Network', error);
          }
      }
    }
  });
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
    const providerInstance = new WalletConnectProvider({
      infuraId: "27e484dcd9e3efcfd25a83a78777cdf1", // Required
    });
    const _provider = await providerInstance.enable();
    const walletConnectProvider = new ethers.providers.Web3Provider(providerInstance);
    provider.set(walletConnectProvider);
    walletConnectProvider
      .getSigner()
      .getAddress()
      .then((address: string) => {
        walletAddress.set(address);
        resolve(true);
      });
  } catch (error) {
    reject(error)
  }
});
