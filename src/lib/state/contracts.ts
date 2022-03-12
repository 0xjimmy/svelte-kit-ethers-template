import { Interface } from 'ethers/lib/utils';
import multicallABI from '$lib/abis/Multicall2.json';

export { multicallABI }

export const IMulticall = new Interface(multicallABI);
