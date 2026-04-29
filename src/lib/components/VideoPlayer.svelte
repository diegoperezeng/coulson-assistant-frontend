<script lang="ts">
	import { X, Maximize2, Minimize2, Play, Pause } from 'lucide-svelte';
	import { onMount, onDestroy } from 'svelte';

	interface Props {
		src: string;
		title?: string;
		onclose: () => void;
	}

	let { src, title = 'Vídeo', onclose }: Props = $props();

	let videoEl: HTMLVideoElement | undefined = $state();
	let isFullscreen = $state(false);
	let isPaused = $state(true);

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onclose();
			return;
		}
		if (e.key === ' ') {
			e.preventDefault();
			if (videoEl) {
				videoEl.paused ? videoEl.play() : videoEl.pause();
			}
		}
		if (e.key === 'ArrowLeft' && videoEl) videoEl.currentTime -= 10;
		if (e.key === 'ArrowRight' && videoEl) videoEl.currentTime += 10;
	}

	function handleFullscreenChange() {
		isFullscreen = !!document.fullscreenElement;
	}

	async function toggleFullscreen() {
		if (!document.fullscreenElement && videoEl) {
			await videoEl.requestFullscreen();
		} else {
			document.exitFullscreen();
		}
	}

	onMount(() => {
		document.addEventListener('keydown', handleKeydown);
		document.addEventListener('fullscreenchange', handleFullscreenChange);
		document.body.style.overflow = 'hidden';
	});

	onDestroy(() => {
		document.removeEventListener('keydown', handleKeydown);
		document.removeEventListener('fullscreenchange', handleFullscreenChange);
		document.body.style.overflow = '';
		if (videoEl) videoEl.pause();
	});
</script>

<div class="fixed inset-0 z-50 bg-black flex flex-col">
	<div
		class="flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent absolute top-0 inset-x-0 z-10"
	>
		<span class="text-sm font-medium text-white/90 truncate max-w-md">{title}</span>
		<div class="flex items-center gap-2">
			<button
				onclick={toggleFullscreen}
				class="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
				title="Tela cheia (F)"
			>
				{#if isFullscreen}
					<Minimize2 size={18} />
				{:else}
					<Maximize2 size={18} />
				{/if}
			</button>
			<button
				onclick={onclose}
				class="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
				title="Fechar (Esc)"
			>
				<X size={18} />
			</button>
		</div>
	</div>

	<div class="flex-1 flex items-center justify-center bg-black">
		<video
			bind:this={videoEl}
			{src}
			controls
			autoplay
			onplay={() => (isPaused = false)}
			onpause={() => (isPaused = true)}
			class="max-w-full max-h-full outline-none"
		>
			<track kind="captions" />
		</video>
	</div>

	<div class="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/30">
		Espaço: play/pause · ← →: ±10s · Esc: fechar
	</div>
</div>
