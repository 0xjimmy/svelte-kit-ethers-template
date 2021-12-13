<script lang="ts">
	import { connectMetamask, connectWalletConnect, walletAddress } from '$lib/stores/provider';
</script>

<section class="flex flex-col p-10 w-screen h-screen items-center gap-5 font-mono">
	<h1 class="text-5xl text-black font-bold">Svelte Ethers Boilerplate</h1>
	<h2 class="text-2xl text-black font-semibold">
		Wallet Address: {$walletAddress ? $walletAddress : 'Not Connected'}
	</h2>
	<button
		on:click={connectMetamask}
		class="p-5 rounded-2xl text-xl bg-black text-white font-semibold hover:scale-[1.05] transition transition-200"
		>Connect via MetaMask</button
	>
	<button
		on:click={connectWalletConnect}
		class="p-5 rounded-2xl text-xl bg-black text-white font-semibold hover:scale-[1.05] transition transition-200"
		>Connect via WalletConnect</button
	>
</section>
