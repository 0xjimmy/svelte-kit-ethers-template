export const ssr = false;
import type { Interface } from "ethers/lib/utils";

export enum Trigger {
  BLOCK,
  EVENT,
  TIME
}

export type ContractCall = {
  target: string,
  interface: Interface,
  selector: string
}

export type DataSync = {
  trigger: Trigger,
  input: Function,
  call?: ContractCall,
  defaultValue?: any
  triggerValue?: any
}
