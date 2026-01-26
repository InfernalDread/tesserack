<script>
    import { Radio, Wifi, WifiOff, Play, Pause, FastForward, SkipForward, AlertCircle } from 'lucide-svelte';
    import {
        labModeEnabled,
        connectionState,
        serverStatus,
        labData,
        connectToLab,
        disconnectFromLab,
        pauseLab,
        resumeLab,
        setLabSpeed,
        stepLab,
    } from '$lib/stores/lab';

    let serverUrl = 'ws://localhost:8765';

    function toggleLabMode() {
        if ($labModeEnabled) {
            labModeEnabled.set(false);
            disconnectFromLab();
        } else {
            labModeEnabled.set(true);
            connectToLab(serverUrl);
        }
    }

    function handleConnect() {
        connectToLab(serverUrl);
    }

    function togglePause() {
        if ($serverStatus.isPaused) {
            resumeLab();
        } else {
            pauseLab();
        }
    }

    function handleSpeedChange(e) {
        setLabSpeed(parseInt(e.target.value));
    }

    $: isConnected = $connectionState === 'connected';
    $: isConnecting = $connectionState === 'connecting';
    $: hasError = $connectionState === 'error';
</script>

<div class="lab-controls panel">
    <div class="mode-toggle">
        <button
            class="mode-btn"
            class:active={$labModeEnabled}
            on:click={toggleLabMode}
            title={$labModeEnabled ? 'Switch to Browser mode' : 'Switch to Lab mode'}
        >
            <Radio size={16} />
            <span>Lab Mode</span>
            <span class="status-dot" class:connected={isConnected} class:connecting={isConnecting} class:error={hasError}></span>
        </button>
    </div>

    {#if $labModeEnabled}
        <div class="connection-section">
            {#if !isConnected}
                <div class="connection-form">
                    <input
                        type="text"
                        bind:value={serverUrl}
                        placeholder="ws://localhost:8765"
                        class="url-input"
                    />
                    <button
                        class="connect-btn"
                        on:click={handleConnect}
                        disabled={isConnecting}
                    >
                        {#if isConnecting}
                            Connecting...
                        {:else if hasError}
                            <AlertCircle size={14} />
                            Retry
                        {:else}
                            <Wifi size={14} />
                            Connect
                        {/if}
                    </button>
                </div>
                {#if hasError}
                    <p class="error-hint">Make sure the lab is running with --server flag</p>
                {/if}
            {:else}
                <div class="lab-status">
                    <div class="status-info">
                        <Wifi size={14} class="connected-icon" />
                        <span>Connected</span>
                        {#if $serverStatus.experimentName}
                            <span class="experiment-name">{$serverStatus.experimentName}</span>
                        {/if}
                    </div>

                    <div class="playback-controls">
                        <button
                            class="control-btn"
                            on:click={togglePause}
                            title={$serverStatus.isPaused ? 'Resume' : 'Pause'}
                        >
                            {#if $serverStatus.isPaused}
                                <Play size={16} />
                            {:else}
                                <Pause size={16} />
                            {/if}
                        </button>

                        <button
                            class="control-btn"
                            on:click={stepLab}
                            disabled={!$serverStatus.isPaused}
                            title="Single step (when paused)"
                        >
                            <SkipForward size={16} />
                        </button>

                        <div class="speed-control">
                            <FastForward size={14} />
                            <select value={$serverStatus.speed} on:change={handleSpeedChange}>
                                <option value={1}>1x</option>
                                <option value={2}>2x</option>
                                <option value={5}>5x</option>
                                <option value={10}>10x</option>
                            </select>
                        </div>
                    </div>

                    <button
                        class="disconnect-btn"
                        on:click={disconnectFromLab}
                    >
                        <WifiOff size={14} />
                    </button>
                </div>

                {#if $labData.metrics}
                    <div class="metrics-bar">
                        <span>Steps: {$labData.metrics.total_steps?.toLocaleString() || 0}</span>
                        <span>Checkpoint: {$labData.metrics.checkpoint || 0}</span>
                        <span>Epsilon: {($labData.metrics.epsilon || 0).toFixed(3)}</span>
                    </div>
                {/if}
            {/if}
        </div>
    {/if}
</div>

<style>
    .lab-controls {
        padding: 12px 16px;
    }

    .mode-toggle {
        display: flex;
        align-items: center;
    }

    .mode-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: var(--bg-input);
        color: var(--text-secondary);
        font-size: 13px;
        font-weight: 500;
        border-radius: var(--border-radius);
        transition: all 0.15s ease;
    }

    .mode-btn:hover {
        background: var(--bg-dark);
    }

    .mode-btn.active {
        background: var(--accent-secondary);
        color: white;
    }

    .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--text-muted);
    }

    .status-dot.connected {
        background: var(--accent-success);
        box-shadow: 0 0 6px var(--accent-success);
    }

    .status-dot.connecting {
        background: var(--accent-warning);
        animation: pulse 1s ease-in-out infinite;
    }

    .status-dot.error {
        background: var(--accent-secondary);
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }

    .connection-section {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid var(--border-color);
    }

    .connection-form {
        display: flex;
        gap: 8px;
    }

    .url-input {
        flex: 1;
        padding: 8px 12px;
        background: var(--bg-input);
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        color: var(--text-primary);
        font-size: 12px;
        font-family: monospace;
    }

    .url-input:focus {
        outline: none;
        border-color: var(--accent-primary);
    }

    .connect-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        background: var(--accent-primary);
        color: white;
        font-size: 12px;
        font-weight: 500;
        border-radius: var(--border-radius);
        transition: all 0.15s ease;
    }

    .connect-btn:hover:not(:disabled) {
        background: #5fa8eb;
    }

    .connect-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .error-hint {
        margin: 8px 0 0;
        font-size: 11px;
        color: var(--accent-secondary);
    }

    .lab-status {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .status-info {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        color: var(--text-secondary);
    }

    .status-info :global(.connected-icon) {
        color: var(--accent-success);
    }

    .experiment-name {
        padding: 2px 8px;
        background: var(--bg-dark);
        border-radius: 4px;
        font-size: 11px;
        color: var(--text-muted);
    }

    .playback-controls {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-left: auto;
    }

    .control-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: var(--bg-input);
        color: var(--text-secondary);
        border-radius: var(--border-radius);
        transition: all 0.15s ease;
    }

    .control-btn:hover:not(:disabled) {
        background: var(--bg-dark);
        color: var(--text-primary);
    }

    .control-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }

    .speed-control {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        background: var(--bg-input);
        border-radius: var(--border-radius);
        color: var(--text-muted);
    }

    .speed-control select {
        background: transparent;
        border: none;
        color: var(--text-secondary);
        font-size: 12px;
        cursor: pointer;
    }

    .disconnect-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: transparent;
        color: var(--text-muted);
        border-radius: var(--border-radius);
        transition: all 0.15s ease;
    }

    .disconnect-btn:hover {
        background: var(--accent-secondary);
        color: white;
    }

    .metrics-bar {
        display: flex;
        gap: 16px;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid var(--border-color);
        font-size: 11px;
        color: var(--text-muted);
    }

    .metrics-bar span {
        display: flex;
        align-items: center;
        gap: 4px;
    }
</style>
