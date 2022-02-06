export const ssr = false;
import { get, writable } from 'svelte/store';
import { Contract } from 'ethers';
import type { BytesLike } from 'ethers'
import { globalState } from '$lib/globalState';
import { Trigger } from '$lib/state/triggers';
import type { DataSync } from '$lib/state/triggers';
import { provider } from '$lib/stores/provider';
import { MULTICALL_ADDRESS } from '$lib/state/presets';
import multicallABI from '$lib/abis/Multicall2.json';

const multicall = new Contract(MULTICALL_ADDRESS, multicallABI, get(provider));
export const state = writable<{ [key: string]: any }>({});

const globalBlockSync: { calls: Array<{ key: string, value: DataSync }>, static: Array<{ key: string, value: DataSync }> } = { calls: [], static: [] };
const globalEventSync: { calls: Array<{ key: string, value: DataSync }>, static: Array<{ key: string, value: DataSync }> } = { calls: [], static: [] };
const globalTimeSync: { calls: Array<{ key: string, value: DataSync }>, static: Array<{ key: string, value: DataSync }> } = { calls: [], static: [] };

// Init store keys and sort global state objects
for (const key in globalState) {
  state.update(state => {
    state[key] = globalState[key].defaultValue ? globalState[key].defaultValue : null;
    return state;
  });
  if (globalState[key].trigger === Trigger.BLOCK) {
    if (globalState[key].call) globalBlockSync.calls.push({ key, value: globalState[key] });
    else globalBlockSync.static.push({ key, value: globalState[key] });
  }
  if (globalState[key].trigger === Trigger.EVENT) {
    if (globalState[key].call) globalEventSync.calls.push({ key, value: globalState[key] });
    else globalEventSync.static.push({ key, value: globalState[key] });
  }
  if (globalState[key].trigger === Trigger.TIME) {
    if (globalState[key].call) globalTimeSync.calls.push({ key, value: globalState[key] });
    else globalTimeSync.static.push({ key, value: globalState[key] });
  }
}

// Manage Block Updates
if (globalBlockSync.static.length > 0 || globalBlockSync.calls.length > 0) {
  get(provider).on('block', (blockHeight) => {
    if (globalBlockSync.calls.length > 0) {
      const callData = globalBlockSync.calls.map(({ value }) => Object({ target: value.call.target, callData: value.call.interface.encodeFunctionData(value.call.selector, value.input(blockHeight)) }))
      multicall.callStatic.tryAggregate(false, callData).then((results: Array<{ success: boolean, returnData: BytesLike }>) => results.map((result, index) => {
        if (result.success) {
          state.update(state => {
            state[globalBlockSync.calls[index].key] = globalBlockSync.calls[index].value.call.interface.decodeFunctionResult(globalBlockSync.calls[index].value.call.selector, result.returnData)[0];
            return state;
          });
        }
      }))
    }
    globalBlockSync.static.forEach(({ key, value }) => {
      state.update(state => {
        state[key] = value.input(blockHeight);
        return state;
      });
    })
  })
}

// Manage Event Updates
if (globalEventSync.static.length > 0 || globalEventSync.calls.length > 0) {
  const staticSet = new Set(globalEventSync.static.map(({ value }) => JSON.stringify(value.triggerValue)));
  const callSet = new Set(globalEventSync.calls.map(({ value }) => JSON.stringify(value.triggerValue)));
  console.log({ staticSet })
  // Compute static values per each unique event
  staticSet.forEach((stringifiedFilter: string) => {
    const states = globalEventSync.static.filter(({ value }) => JSON.stringify(value.triggerValue) === stringifiedFilter)
    get(provider).on(states[0].value.triggerValue, (log, event) => {
      states.forEach(({ key, value }) => {
        state.update(state => {
          state[key] = value.input({ log, event });
          return state;
        });
      })
    })
  })
  // Agregate calls per each unique event
  callSet.forEach((stringifiedFilter: string) => {
    const states = globalEventSync.calls.filter(({ value }) => JSON.stringify(value.triggerValue) === stringifiedFilter);
    get(provider).on(states[0].value.triggerValue, (log, event) => {
      const callData = states.map(({ value }) => Object({ target: value.call.target, callData: value.call.interface.encodeFunctionData(value.call.selector, value.input({ log, event })) }))
      multicall.callStatic.tryAggregate(false, callData).then((results: Array<{ success: boolean, returnData: BytesLike }>) => results.map((result, index) => {
        if (result.success) {
          state.update(state => {
            state[states[index].key] = states[index].value.call.interface.decodeFunctionResult(states[index].value.call.selector, result.returnData)[0];
            return state;
          });
        }
      }))
    })
  })
}

// Manage Time Updates
if (globalTimeSync.static.length > 0 || globalTimeSync.calls.length > 0) {
  const staticSet = new Set(globalTimeSync.static.map(({ value }) => value.triggerValue));
  const callSet = new Set(globalTimeSync.calls.map(({ value }) => value.triggerValue));
  // Compute static values per each unique timeout
  staticSet.forEach((timeout: number) => {
    const states = globalTimeSync.static.filter(({ value }) => value.triggerValue === timeout)
    setInterval(() => {
      states.forEach(({ key, value }) => {
        state.update(state => {
          state[key] = value.input(Date.now());
          return state;
        });
      })
    }, timeout)
  })
  // Agregate calls per each unique timeout
  callSet.forEach((timeout: number) => {
    const states = globalTimeSync.calls.filter(({ value }) => value.triggerValue === timeout);
    setInterval(() => {
      const callData = states.map(({ value }) => Object({ target: value.call.target, callData: value.call.interface.encodeFunctionData(value.call.selector, value.input(Date.now())) }))
      multicall.callStatic.tryAggregate(false, callData).then((results: Array<{ success: boolean, returnData: BytesLike }>) => results.map((result, index) => {
        if (result.success) {
          state.update(state => {
            state[states[index].key] = states[index].value.call.interface.decodeFunctionResult(states[index].value.call.selector, result.returnData)[0];
            return state;
          });
        }
      }))
    }, timeout)
  })
}
