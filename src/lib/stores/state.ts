export const ssr = false;
import { BigNumber } from "ethers";
import { writable } from "svelte/store";
import '$lib/globalState';

export const balanceOnBlock = writable<BigNumber>(BigNumber.from(0)); 
