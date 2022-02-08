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
const globalEventSync: { events: Set<string>, calls: Array<{ key: string, value: DataSync }>, static: Array<{ key: string, value: DataSync }> } = { events: new Set(), calls: [], static: [] };
const globalTimeSync: { events: Set<number>, calls: Array<{ key: string, value: DataSync }>, static: Array<{ key: string, value: DataSync }> } = { events: new Set(), calls: [], static: [] };
const scopedBlockSync: { eventListener: (blockHeight: number) => void, calls: Array<{ key: string, value: DataSync }>, static: Array<{ key: string, value: DataSync }> } = { eventListener: null, calls: [], static: [] };
const scopedEventSync: { events: Set<string>, eventListeners: Array<{ stringifiedFilter: string, event: any, listener: (log: any, event: any) => void }>, calls: Array<{ key: string, value: DataSync }>, static: Array<{ key: string, value: DataSync }> } = { events: new Set(), eventListeners: [], calls: [], static: [] };
const scopedTimeSync: { events: Set<number>, eventValue: { [key: string]: NodeJS.Timer }, calls: Array<{ key: string, value: DataSync }>, static: Array<{ key: string, value: DataSync }> } = { events: new Set(), eventValue: {}, calls: [], static: [] };

export const addScopedSync = (name: string, options: DataSync) => {
  state.update((state) => {
    state[name] = options.defaultValue ? options.defaultValue : null;
    return state;
  });

  if (options.trigger === Trigger.BLOCK) {
    if (options.call) scopedBlockSync.calls.push({ key: name, value: options });
    else scopedBlockSync.static.push({ key: name, value: options });
    if (globalBlockSync.static.length === 0 && globalBlockSync.calls.length === 0 && !scopedBlockSync.eventListener) {
      scopedBlockSync.eventListener = (blockHeight) => {
        if (scopedBlockSync.calls.length > 0) {
          const callData = scopedBlockSync.calls.map(({ value }) => Object({ target: value.call.target, callData: value.call.interface.encodeFunctionData(value.call.selector, value.input(blockHeight)) }))
          multicall.callStatic.tryAggregate(false, callData).then((results: Array<{ success: boolean, returnData: BytesLike }>) => results.map((result, index) => {
            if (result.success) {
              state.update(state => {
                state[scopedBlockSync.calls[index].key] = scopedBlockSync.calls[index].value.call.interface.decodeFunctionResult(scopedBlockSync.calls[index].value.call.selector, result.returnData)[0];
                return state;
              });
            }
          }))
        }
        scopedBlockSync.static.forEach(({ key, value }) => {
          state.update(state => {
            state[key] = value.input(blockHeight);
            return state;
          });
        })
      }
      get(provider).on('block', scopedBlockSync.eventListener);
    }
  }

  if (options.trigger === Trigger.EVENT) {
    if (options.call) scopedEventSync.calls.push({ key: name, value: options });
    else scopedEventSync.static.push({ key: name, value: options });
    if (!globalEventSync.events.has(JSON.stringify(options.triggerValue)) && !scopedEventSync.events.has(JSON.stringify(options.triggerValue))) {
      scopedEventSync.events.add(JSON.stringify(options.triggerValue));
      // create event eventListener
      const stringifiedFilter = JSON.stringify(options.triggerValue)
      scopedEventSync.eventListeners.push({
        stringifiedFilter, event: options.triggerValue, listener: (log, event) => {
          // Static (No call)
          scopedEventSync.static.filter(({ value }) => JSON.stringify(value.triggerValue) === stringifiedFilter).forEach(({ key, value }) => {
            state.update(state => {
              state[key] = value.input({ log, event });
              return state;
            });
          })
          // Multicall
          const matchingCalls = scopedEventSync.calls.filter(({ value }) => JSON.stringify(value.triggerValue) === stringifiedFilter);
          const callData = matchingCalls.map(({ value }) => Object({ target: value.call.target, callData: value.call.interface.encodeFunctionData(value.call.selector, value.input({ log, event })) }))
          multicall.callStatic.tryAggregate(false, callData).then((results: Array<{ success: boolean, returnData: BytesLike }>) => results.map((result, index) => {
            if (result.success) {
              state.update(state => {
                state[matchingCalls[index].key] = matchingCalls[index].value.call.interface.decodeFunctionResult(matchingCalls[index].value.call.selector, result.returnData)[0];
                return state;
              });
            }
          }))
        }
      })
      get(provider).on(scopedEventSync.eventListeners[scopedEventSync.eventListeners.length - 1].event, scopedEventSync.eventListeners[scopedEventSync.eventListeners.length - 1].listener);
    }
  }

  if (options.trigger === Trigger.TIME) {
    if (options.call) scopedTimeSync.calls.push({ key: name, value: options });
    else scopedTimeSync.static.push({ key: name, value: options });
    if (!globalTimeSync.events.has(options.triggerValue) && !scopedTimeSync.events.has(options.triggerValue)) {
      scopedTimeSync.events.add(options.triggerValue);
      const intervalID = setInterval(() => {
        // Static (No call)
        scopedTimeSync.static.filter(({ value }) => value.triggerValue === options.triggerValue).forEach(({ key, value }) => {
          state.update(state => {
            state[key] = value.input(Date.now());
            return state;
          });
        })
        // Multicall
        const matchingCalls = scopedTimeSync.calls.filter(({ value }) => value.triggerValue === options.triggerValue);
        const callData = matchingCalls.map(({ value }) => Object({ target: value.call.target, callData: value.call.interface.encodeFunctionData(value.call.selector, value.input(Date.now())) }));
        multicall.callStatic.tryAggregate(false, callData).then((results: Array<{ success: boolean, returnData: BytesLike }>) => results.map((result, index) => {
          if (result.success) {
            state.update(state => {
              state[matchingCalls[index].key] = matchingCalls[index].value.call.interface.decodeFunctionResult(matchingCalls[index].value.call.selector, result.returnData)[0];
              return state;
            });
          }
        }));
      }, options.triggerValue);
      scopedTimeSync.eventValue[options.triggerValue] = intervalID;
    }
  }
}

export const removeScopedSync = (name: string, options: DataSync) => {
  if (options.trigger === Trigger.BLOCK) {
    if (options.call) scopedBlockSync.calls.splice(scopedBlockSync.calls.findIndex(({ key }) => key === name), 1);
    else scopedBlockSync.static.splice(scopedBlockSync.static.findIndex(({ key }) => key === name), 1);

    // Clean up events
    if (globalBlockSync.static.length === 0 && globalBlockSync.calls.length === 0 && [...scopedBlockSync.calls, ...scopedBlockSync.static].filter(({ value }) => value.triggerValue === options.triggerValue).length === 0) {
      get(provider).off('block', scopedBlockSync.eventListener);
      scopedBlockSync.eventListener = null;
    }
  }

  if (options.trigger === Trigger.EVENT) {
    if (options.call) scopedEventSync.calls.splice(scopedEventSync.calls.findIndex(({ key }) => key === name), 1);
    else scopedEventSync.static.splice(scopedEventSync.static.findIndex(({ key }) => key === name), 1);

    // Clean up events
    const _stringifiedFilter = JSON.stringify(options.triggerValue);
    if (!globalEventSync.events.has(JSON.stringify(options.triggerValue)) && [...scopedEventSync.calls, ...scopedEventSync.static].filter(({ value }) => JSON.stringify(value.triggerValue) === _stringifiedFilter).length === 0) {
      scopedEventSync.events.delete(_stringifiedFilter);
      const index = scopedEventSync.eventListeners.findIndex(({ stringifiedFilter }) => stringifiedFilter === _stringifiedFilter);
      get(provider).off(scopedEventSync.eventListeners[index].event, scopedEventSync.eventListeners[index].listener);
      scopedEventSync.eventListeners.splice(index, 1);
    }
  }

  if (options.trigger === Trigger.TIME) {
    if (options.call) scopedTimeSync.calls.splice(scopedTimeSync.calls.findIndex(({ key }) => key === name), 1);
    else scopedTimeSync.static.splice(scopedTimeSync.static.findIndex(({ key }) => key === name), 1);

    // Clean up events
    if (!globalTimeSync.events.has(options.triggerValue) && [...scopedTimeSync.calls, ...scopedTimeSync.static].filter(({ value }) => value.triggerValue === options.triggerValue).length === 0) {
      scopedTimeSync.events.delete(options.triggerValue);
      clearInterval(scopedTimeSync.eventValue[options.triggerValue]);
      delete scopedTimeSync.eventValue[options.triggerValue]
    }
  }
}

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
    globalEventSync.events.add(JSON.stringify(globalState[key].triggerValue));
  }
  if (globalState[key].trigger === Trigger.TIME) {
    if (globalState[key].call) globalTimeSync.calls.push({ key, value: globalState[key] });
    else globalTimeSync.static.push({ key, value: globalState[key] });
    globalTimeSync.events.add(globalState[key].triggerValue);
  }
}

// Manage Block Updates
if (globalBlockSync.static.length > 0 || globalBlockSync.calls.length > 0) {
  get(provider).on('block', (blockHeight) => {
    if (globalBlockSync.calls.length > 0 || scopedBlockSync.calls.length > 0) {
      const matchingCalls = [...globalBlockSync.calls, ...scopedBlockSync.calls];
      const callData = matchingCalls.map(({ value }) => Object({ target: value.call.target, callData: value.call.interface.encodeFunctionData(value.call.selector, value.input(blockHeight)) }))
      multicall.callStatic.tryAggregate(false, callData).then((results: Array<{ success: boolean, returnData: BytesLike }>) => results.map((result, index) => {
        if (result.success) {
          state.update(state => {
            state[matchingCalls[index].key] = matchingCalls[index].value.call.interface.decodeFunctionResult(matchingCalls[index].value.call.selector, result.returnData)[0];
            return state;
          });
        }
      }))
    }
    [...globalBlockSync.static, ...scopedBlockSync.static].forEach(({ key, value }) => {
      state.update(state => {
        state[key] = value.input(blockHeight);
        return state;
      });
    })
  })
}

// Manage Event Updates
globalEventSync.events.forEach((stringifiedFilter: string) => {
  const parsedEvent = JSON.parse(stringifiedFilter);
  get(provider).on(parsedEvent, (log, event) => {
    // Static (No call)
    [...globalEventSync.static, ...scopedEventSync.static].filter(({ value }) => JSON.stringify(value.triggerValue) === stringifiedFilter).forEach(({ key, value }) => {
      state.update(state => {
        state[key] = value.input({ log, event });
        return state;
      });
    })
    // Multicall
    const matchingCalls = [...globalEventSync.calls, ...scopedEventSync.calls].filter(({ value }) => JSON.stringify(value.triggerValue) === stringifiedFilter);
    const callData = matchingCalls.map(({ value }) => Object({ target: value.call.target, callData: value.call.interface.encodeFunctionData(value.call.selector, value.input({ log, event })) }))
    multicall.callStatic.tryAggregate(false, callData).then((results: Array<{ success: boolean, returnData: BytesLike }>) => results.map((result, index) => {
      if (result.success) {
        state.update(state => {
          state[matchingCalls[index].key] = matchingCalls[index].value.call.interface.decodeFunctionResult(matchingCalls[index].value.call.selector, result.returnData)[0];
          return state;
        });
      }
    }))
  })
})

// Manage Time Updates
globalTimeSync.events.forEach((timeout: number) => {
  setInterval(() => {
    // Static (No call)
    [...globalTimeSync.static, ...scopedTimeSync.static].filter(({ value }) => value.triggerValue === timeout).forEach(({ key, value }) => {
      state.update(state => {
        state[key] = value.input(Date.now());
        return state;
      });
    })
    // Multicall
    const matchingCalls = [...globalTimeSync.calls, ...scopedTimeSync.calls].filter(({ value }) => value.triggerValue === timeout);
    const callData = matchingCalls.map(({ value }) => Object({ target: value.call.target, callData: value.call.interface.encodeFunctionData(value.call.selector, value.input(Date.now())) }));
    multicall.callStatic.tryAggregate(false, callData).then((results: Array<{ success: boolean, returnData: BytesLike }>) => results.map((result, index) => {
      if (result.success) {
        state.update(state => {
          state[matchingCalls[index].key] = matchingCalls[index].value.call.interface.decodeFunctionResult(matchingCalls[index].value.call.selector, result.returnData)[0];
          return state;
        });
      }
    }));
  }, timeout)
})
