<script>
    import { onMount } from 'svelte';
    import { emulator } from '$lib/stores/game';

    let canvas;

    onMount(() => {
        // Canvas will be connected to emulator
        // $emulator?.setCanvas(canvas);
    });
</script>

<div class="canvas-container">
    <canvas
        bind:this={canvas}
        width="160"
        height="144"
        class="game-canvas"
    ></canvas>
</div>

<style>
    .canvas-container {
        background: var(--bg-panel);
        border-radius: var(--border-radius);
        padding: 10px;
    }

    .game-canvas {
        width: 320px;
        height: 288px;
        image-rendering: pixelated;
        background: #000;
        display: block;
        border-radius: var(--border-radius-sm);
    }
</style>
