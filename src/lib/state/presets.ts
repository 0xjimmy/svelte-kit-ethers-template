export const ssr = false;
import { hexZeroPad, Interface } from 'ethers/lib/utils';
import { Trigger } from '$lib/state/triggers';
import type { DataSync, ContractCall } from '$lib/state/triggers';
import multicallABI from '$lib/abis/Multicall2.json';
import { utils } from 'ethers';

export const blockHeight: DataSync = {
  trigger: Trigger.BLOCK,
  input: (blockHeight: number) => blockHeight
}

export const MULTICALL_ADDRESS = '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696';

const IMulticall = new Interface(multicallABI);

export const balanceCall: ContractCall = {
  target: MULTICALL_ADDRESS,
  interface: IMulticall,
  selector: 'getEthBalance'
}

export const createTransferEvent = (token: string, from: string[] = null, to: string[] = null) => {
  const filter = {
    address: token,
    topics: [
      utils.id("Transfer(address,address,uint256)"),
      from ? from.length > 1 ? from.map(address => hexZeroPad(address, 32)) : hexZeroPad(from[0], 32) : null,
      to ? to.length > 1 ? to.map(address => hexZeroPad(address, 32)) : hexZeroPad(to[0], 32) : null
    ]
  }
  return filter;
}
