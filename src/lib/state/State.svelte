<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { addScopedSync, removeScopedSync } from '$lib/stores/state';
	import type { DataSync } from '$lib/state/triggers';

	export const ssr = false;
	export let options: DataSync;
	export let name: string;

	onMount(() => addScopedSync(name, options));

	onDestroy(() => removeScopedSync(name, options));
</script>
