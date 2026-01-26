<script>
    import { labData, connectionState } from '$lib/stores/lab';
    import { Radio, WifiOff } from 'lucide-svelte';

    $: frame = $labData.frame;
    $: isConnected = $connectionState === 'connected';
    $: imageSrc = frame ? `data:image/png;base64,${frame}` : null;
</script>

<div class="canvas-container">
    {#if isConnected && imageSrc}
        <img
            src={imageSrc}
            alt="Game frame from lab"
            class="game-frame"
        />
    {:else}
        <div class="placeholder">
            {#if !isConnected}
                <WifiOff size={32} />
                <span>Not connected to lab</span>
            {:else}
                <Radio size={32} />
                <span>Waiting for frames...</span>
            {/if}
        </div>
    {/if}

    {#if isConnected}
        <div class="lab-badge">
            <Radio size={12} />
            <span>Lab</span>
        </div>
    {/if}
</div>

<style>
    .canvas-container {
        position: relative;
        background: var(--bg-panel);
        border-radius: var(--border-radius);
        padding: 12px;
        border: 1px solid var(--border-color);
        box-shadow: var(--shadow-soft);
    }

    .game-frame {
        width: 100%;
        aspect-ratio: 160 / 144;
        image-rendering: pixelated;
        background: #000;
        display: block;
        border-radius: var(--border-radius-sm);
    }

    .placeholder {
        width: 100%;
        aspect-ratio: 160 / 144;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        background: var(--bg-dark);
        border-radius: var(--border-radius-sm);
        color: var(--text-muted);
    }

    .placeholder span {
        font-size: 12px;
    }

    .lab-badge {
        position: absolute;
        top: 20px;
        right: 20px;
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        background: rgba(0, 0, 0, 0.7);
        border-radius: 4px;
        color: var(--accent-secondary);
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
</style>
