export const ssr = false;
import { derived, get, writable } from 'svelte/store';
import { BigNumber, constants, providers } from 'ethers';
// @ts-ignore
import WalletConnectProvider from '@walletconnect/ethereum-provider/dist/umd/index.min.js';
import { browser } from '$app/environment';
import { NETWORKS } from '$lib/config';

export const networkProviders: { [chainId: string]: providers.JsonRpcProvider } = NETWORKS.reduce((networks, network) => {
  return { ...networks, [network.chainId]: new providers.JsonRpcProvider(network.rpcUrl) }
}, {});

export const selectedNetworkIndex = writable<number>(0);

export const accountProvider = writable(undefined);
export const accountChainId = writable({ chainId: NETWORKS[get(selectedNetworkIndex)].chainId, supportedNetwork: true });
export const connected = derived(accountProvider, ($accountProvider) => $accountProvider ? true : false);
export const walletAddress = writable(constants.AddressZero);

let disconnectListener, accountsChangedListener, chainChangedListener;

// Connect With injected wallet and WalletConnect

export const connectMetamask = () => new Promise((resolve, reject) => {
  if (!window['ethereum']) reject('No injected provider found');
  else {
    try {
      window['ethereum'].request({ method: 'eth_requestAccounts' }).then((accounts: string[]) => {
        if (accounts.length > 0) {
          accountProvider.update(provider => {
            if (provider) {
              get(accountProvider).removeListener('accountsChanged', accountsChangedListener);
              get(accountProvider).removeListener('chainChanged', chainChangedListener);
              get(accountProvider).removeListener('disconnect', disconnectListener);
            }
            return window['ethereum'];
          })
          sessionStorage.setItem('connectType', 'metamask');
          disconnectListener = () => {
            get(accountProvider).removeListener('accountsChanged', accountsChangedListener);
            get(accountProvider).removeListener('chainChanged', chainChangedListener);
            get(accountProvider).removeListener('disconnect', disconnectListener);
            accountProvider.set(undefined);
            walletAddress.set(constants.AddressZero);
          }
          get(accountProvider).on('disconnect', disconnectListener);
          const chainId = BigNumber.from(get(accountProvider).chainId).toNumber();
          const supportedNetwork: boolean = NETWORKS.filter(network => network.chainId === chainId).length > 0;
          if (supportedNetwork) selectedNetworkIndex.set(NETWORKS.findIndex(network => network.chainId === chainId));
          accountChainId.set({ chainId, supportedNetwork });
          walletAddress.set(accounts[0]);
          accountsChangedListener = (accounts: string[]) => {
            if (accounts.length > 0) walletAddress.set(accounts[0]);
            else {
              walletAddress.set(constants.AddressZero);
              accountProvider.set(undefined);
            }
          }
          get(accountProvider).on('accountsChanged', accountsChangedListener);
          chainChangedListener = (chainIdHex: string) => {
            const chainId = BigNumber.from(chainIdHex).toNumber();
            const supportedNetwork: boolean = NETWORKS.filter(network => network.chainId === chainId).length > 0;
            if (supportedNetwork) selectedNetworkIndex.set(NETWORKS.findIndex(network => network.chainId === chainId));
            accountChainId.set({ chainId, supportedNetwork });
          }
          get(accountProvider).on('chainChanged', chainChangedListener);
        }
      });
      resolve(true);
    } catch (error) {
      reject(error);
    }
  }
});

export const connectWalletConnect = () => new Promise(async (resolve, reject) => {
  try {
    const providerInstance = new WalletConnectProvider({ rpc: NETWORKS.reduce((networks, network) => ({ ...networks, [network.chainId]: network.rpcUrl }), {}) });
    providerInstance.request({ method: 'eth_requestAccounts' }).then((accounts: string[]) => {
      if (accounts.length > 0) {
        accountProvider.update(provider => {
          if (provider) {
            get(accountProvider).removeListener('accountsChanged', accountsChangedListener);
            get(accountProvider).removeListener('chainChanged', chainChangedListener);
            get(accountProvider).removeListener('disconnect', disconnectListener);
          }
          return providerInstance;
        })
        sessionStorage.setItem('connectType', 'walletconnect');
        disconnectListener = () => {
          get(accountProvider).removeListener('accountsChanged', accountsChangedListener);
          get(accountProvider).removeListener('chainChanged', chainChangedListener);
          get(accountProvider).removeListener('disconnect', disconnectListener);
          accountProvider.set(undefined);
          walletAddress.set(constants.AddressZero);
        }
        get(accountProvider).on('disconnect', disconnectListener);
        const chainId = BigNumber.from(get(accountProvider).chainId).toNumber();
        const supportedNetwork: boolean = NETWORKS.filter(network => network.chainId === chainId).length > 0;
        if (supportedNetwork) selectedNetworkIndex.set(NETWORKS.findIndex(network => network.chainId === chainId));
        accountChainId.set({ chainId, supportedNetwork });
        walletAddress.set(accounts[0]);
        accountsChangedListener = (accounts: string[]) => {
          if (accounts.length > 0) walletAddress.set(accounts[0]);
          else {
            walletAddress.set(constants.AddressZero);
            accountProvider.set(undefined);
          }
        }
        get(accountProvider).on('accountsChanged', accountsChangedListener);
        chainChangedListener = (chainIdHex: string) => {
          const chainId = BigNumber.from(chainIdHex).toNumber();
          const supportedNetwork: boolean = NETWORKS.filter(network => network.chainId === chainId).length > 0;
          if (supportedNetwork) selectedNetworkIndex.set(NETWORKS.findIndex(network => network.chainId === chainId));
          accountChainId.set({ chainId, supportedNetwork });
        }
        get(accountProvider).on('chainChanged', chainChangedListener);
      }
    });
    resolve(true);
  } catch (error) {
    reject(error)
  }
});

// Disconnect And Store connection between reloads

if (browser && JSON.parse(sessionStorage.getItem('connected'))) {
  if (sessionStorage.getItem('connectType') === 'metamask') {
    if (window['ethereum'].selectedAddress) connectMetamask();
  }
  if (sessionStorage.getItem('connectType') === 'walletconnect') {
    const providerInstance = new WalletConnectProvider({ rpc: NETWORKS.reduce((networks, network) => ({ ...networks, [network.chainId]: network.rpcUrl }), {}) });
    if (providerInstance.connected) connectWalletConnect();
  }
}

connected.subscribe((value) => {
  if (browser) sessionStorage.setItem('connected', JSON.stringify(value));
})

export const disconnect = () => {
  if (get(accountProvider)) {
    get(accountProvider).removeListener('accountsChanged', accountsChangedListener);
    get(accountProvider).removeListener('chainChanged', chainChangedListener);
    get(accountProvider).removeListener('disconnect', disconnectListener);
    accountProvider.set(undefined);
    walletAddress.set(constants.AddressZero);
  }
}
