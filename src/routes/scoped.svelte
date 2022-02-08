<script lang="ts">
	import { formatEther } from 'ethers/lib/utils';
	import {
		connected,
		connectMetamask,
		connectWalletConnect,
		disconnect,
		walletAddress
	} from '$lib/stores/provider';
	import { state } from '$lib/stores/state';
	import State from '$lib/state/State.svelte';
	import { Trigger } from '$lib/state/triggers';
</script>

<main class="flex flex-col p-10 w-screen h-screen items-center gap-5 font-mono">
	<section class="flex flex-col p-10 items-start gap-5 border-2 rounded-xl">
		<h1 class="text-2xl text-black font-bold">Wallet and $provider</h1>
		<h2 class="text-xl text-black font-semibold">
			$walletAddress: {$connected ? $walletAddress : 'Not Connected'}
		</h2>
		<h2 class="text-xl text-black font-semibold">
			$connected: {$connected}
		</h2>
		<button
			on:click={connectMetamask}
			class="p-3 rounded-xl text-xl bg-black text-white font-semibold hover:scale-[1.05] transition transition-200"
			>Connect via MetaMask</button
		>
		<button
			on:click={connectWalletConnect}
			class="p-3 rounded-xl text-xl bg-black text-white font-semibold hover:scale-[1.05] transition transition-200"
			>Connect via WalletConnect</button
		>
		{#if $connected}
			<button
				on:click={disconnect}
				class="p-3 rounded-xl text-xl bg-black text-white font-semibold hover:scale-[1.05] transition transition-200"
				>Disconnect</button
			>
		{/if}
	</section>
	<section class="flex flex-col p-10 items-start gap-5 border-2 rounded-xl">
		<h1 class="text-2xl text-black font-bold">Scope network state per component</h1>
		<p>Don't update data when it is not needed.</p>
		<a href="/" class="bg-black text-white p-2 rounded-xl">back to /</a>
		<State name="someData" options={{ trigger: Trigger.BLOCK, input: () => 'Static Return' }} />
		<h2 class="text-xl text-black font-semibold">
			$state.someData: {$state.someData}
		</h2>

		<hr class="m-3 border-2 w-full" />
		<p>
			Configure global state in <span class="p-1 rounded text-gray-600 bg-gray-200"
				>src/lib/globalState.ts</span
			>.
		</p>
		<p class="-mb-5">Preset on block, blockHeight</p>
		<h2 class="text-xl text-black font-semibold">
			$state.blockHeight: {$state.blockHeight}
		</h2>
		<p class="-mb-5">Example call on block</p>
		<h2 class="text-xl text-black font-semibold">
			$state.balanceOnBlock: {formatEther($state.balanceOnBlock)}
		</h2>
		<p class="-mb-5">Example call on interval</p>
		<h2 class="text-xl text-black font-semibold">
			$state.balanceOnTime: {formatEther($state.balanceOnTime)}<br />
			$state.timeState1: {$state.timeState1}<br />
			$state.timeState2: {$state.timeState2}<br />
			$state.timeState3: {$state.timeState3}
		</h2>
		<p class="-mb-5">Example call on event</p>
		<h2 class="text-xl text-black font-semibold">
			$state.transferEventSender: {$state.transferEventSender}<br />
			$state.transferEventSenderBalance: {formatEther($state.transferEventSenderBalance)}
		</h2>
	</section>
</main>
