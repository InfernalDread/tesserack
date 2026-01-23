<script>
    import { modelState } from '$lib/stores/training';
    import { romLoaded } from '$lib/stores/game';
    import { Cpu, CheckCircle, XCircle } from 'lucide-svelte';
</script>

<header class="header">
    <div class="logo">
        <div class="logo-icon">
            <Cpu size={24} />
        </div>
        <div class="logo-text">
            <h1>Tesserack</h1>
            <span class="tagline">AI Plays Pokemon</span>
        </div>
    </div>

    <div class="status">
        {#if $romLoaded}
            {#if $modelState.hasModel}
                <span class="model-badge trained">
                    <CheckCircle size={14} />
                    Model v{$modelState.sessions}
                </span>
            {:else}
                <span class="model-badge untrained">
                    <XCircle size={14} />
                    No Model
                </span>
            {/if}
        {/if}
    </div>
</header>

<style>
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 16px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .logo {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .logo-icon {
        color: var(--accent-primary);
    }

    .logo-text h1 {
        font-size: 22px;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0;
        letter-spacing: -0.5px;
    }

    .tagline {
        font-size: 11px;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    .model-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        padding: 6px 12px;
        border-radius: 20px;
        font-weight: 500;
    }

    .model-badge.trained {
        background: rgba(39, 174, 96, 0.15);
        color: var(--accent-success);
    }

    .model-badge.untrained {
        background: rgba(255, 107, 107, 0.15);
        color: var(--accent-secondary);
    }
</style>
