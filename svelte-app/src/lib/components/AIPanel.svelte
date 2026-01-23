<script>
    import { activeMode, aiState, stats } from '$lib/stores/agent';
    import { modelState, trainingProgress } from '$lib/stores/training';

    $: isActive = $activeMode !== 'idle' && $activeMode !== 'manual';
</script>

<div class="ai-panel panel">
    {#if $activeMode === 'train'}
        <!-- Training mode view -->
        <div class="panel-title">Training Progress</div>

        {#if $trainingProgress.active}
            <div class="training-status">
                <div class="progress-text">{$trainingProgress.message}</div>
                <div class="progress-bar">
                    <div
                        class="progress-fill"
                        style="width: {($trainingProgress.epoch / $trainingProgress.totalEpochs) * 100}%"
                    ></div>
                </div>
            </div>
        {:else}
            <div class="training-stats">
                <div class="stat">
                    <span class="value">{$stats.experiences.toLocaleString()}</span>
                    <span class="label">Experiences</span>
                </div>
                <div class="stat">
                    <span class="value">{$modelState.nextAutoTrain.toLocaleString()}</span>
                    <span class="label">Next Train</span>
                </div>
            </div>
        {/if}

    {:else if $activeMode === 'watch'}
        <!-- Watch AI mode view -->
        <div class="panel-title">AI Thinking</div>

        <div class="objective">
            {$aiState.objective || 'Analyzing game state...'}
        </div>

        <div class="reasoning">
            {$aiState.reasoning || 'Deciding next action...'}
        </div>

        {#if $aiState.actions.length > 0}
            <div class="actions">
                <span class="actions-label">Actions:</span>
                <span class="actions-list">{$aiState.actions.join(', ')}</span>
            </div>
        {/if}

        {#if $aiState.planSource}
            <div class="source">
                via {$aiState.planSource}
            </div>
        {/if}

    {:else if $activeMode === 'manual'}
        <!-- Manual mode view -->
        <div class="panel-title">Manual Mode</div>
        <div class="manual-message">
            You're in control! Use the D-pad and buttons below, or keyboard:
            <div class="key-hints">
                <span>Arrow keys = D-pad</span>
                <span>Z = A</span>
                <span>X = B</span>
                <span>Enter = Start</span>
            </div>
        </div>

    {:else}
        <!-- Idle state -->
        <div class="panel-title">Ready</div>
        <div class="idle-message">
            Select a mode above to begin
        </div>
    {/if}
</div>

<style>
    .ai-panel {
        min-height: 160px;
    }

    .objective {
        font-size: 15px;
        font-weight: 500;
        color: var(--accent-secondary);
        margin-bottom: 12px;
    }

    .reasoning {
        font-size: 13px;
        color: var(--text-primary);
        line-height: 1.6;
        margin-bottom: 12px;
    }

    .actions {
        background: var(--bg-dark);
        padding: 10px 12px;
        border-radius: var(--border-radius-sm);
        font-size: 13px;
    }

    .actions-label {
        color: var(--text-secondary);
        margin-right: 8px;
    }

    .actions-list {
        color: var(--accent-primary);
        font-weight: 500;
    }

    .source {
        margin-top: 8px;
        font-size: 11px;
        color: var(--text-muted);
    }

    .training-stats {
        display: flex;
        gap: 24px;
    }

    .stat {
        display: flex;
        flex-direction: column;
    }

    .stat .value {
        font-size: 24px;
        font-weight: 600;
        color: var(--accent-primary);
    }

    .stat .label {
        font-size: 11px;
        color: var(--text-secondary);
        text-transform: uppercase;
    }

    .progress-bar {
        height: 6px;
        background: var(--bg-dark);
        border-radius: 3px;
        overflow: hidden;
        margin-top: 8px;
    }

    .progress-fill {
        height: 100%;
        background: var(--accent-success);
        transition: width 0.3s;
    }

    .progress-text {
        font-size: 13px;
        color: var(--text-secondary);
    }

    .manual-message {
        font-size: 13px;
        color: var(--text-secondary);
    }

    .key-hints {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 12px;
        font-size: 12px;
        color: var(--text-muted);
    }

    .key-hints span {
        background: var(--bg-dark);
        padding: 4px 8px;
        border-radius: var(--border-radius-sm);
    }

    .idle-message {
        color: var(--text-muted);
        font-size: 13px;
    }
</style>
