export const ssr = false;
import type { BigNumber } from 'ethers';
import { Sync, Trigger } from '$lib/state/state'
import { IMulticall } from '$lib/state/contracts';
import { balanceOnBlock } from "$lib/stores/state";
import { NETWORKS } from '$lib/config';

// Mainnet Syncs
new Sync(NETWORKS[0], [
  {
    trigger: Trigger.BLOCK,
    input: () => ['0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'],
    output: (value: [BigNumber]) => balanceOnBlock.set(value[0]),
    call: {
      target: () => NETWORKS[0].multicall2Address,
      interface: IMulticall,
      selector: 'getEthBalance'
    }
  }
])
