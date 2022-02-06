export const ssr = false;
import { Trigger } from '$lib/state/triggers'
import type { DataSync } from '$lib/state/triggers'
import { balanceCall, blockHeight, createTransferEvent } from '$lib/state/presets'
import erc20ABI from '$lib/abis/IERC20.json';
import { BigNumber } from 'ethers';
import { Interface } from 'ethers/lib/utils';

const IErc20 = new Interface(erc20ABI);

export const globalState: { [key: string]: DataSync } = {
  blockHeight,
  balanceOnBlock: { trigger: Trigger.BLOCK, input: () => ["0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"], call: balanceCall, defaultValue: BigNumber.from(0) },
  balanceOnTime: { trigger: Trigger.TIME, triggerValue: 5000, input: () => ["0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"], call: balanceCall, defaultValue: BigNumber.from(0) },
  timeState1: { ...blockHeight, trigger: Trigger.TIME, triggerValue: 1000 },
  timeState2: { ...blockHeight, trigger: Trigger.TIME, triggerValue: 15000 },
  timeState3: { ...blockHeight, trigger: Trigger.TIME, triggerValue: 1000 },
  transferEventSender: {
    trigger: Trigger.EVENT, triggerValue: createTransferEvent("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"), input: ({ log }) => {
      const transfer = IErc20.decodeEventLog("Transfer", log.data, log.topics);
      return transfer.from;
    }, defaultValue: "Waiting for transfers"
  },
  transferEventSenderBalance: {
    trigger: Trigger.EVENT, triggerValue: createTransferEvent("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"), input: ({ log }) => {
      const transfer = IErc20.decodeEventLog("Transfer", log.data, log.topics);
      return [transfer.from];
    }, defaultValue: BigNumber.from(0), call: balanceCall
  },
}
