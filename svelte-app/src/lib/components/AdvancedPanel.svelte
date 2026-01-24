<script>
    import { onMount } from 'svelte';
    import { modelState, trainingProgress, autoTrainEnabled } from '$lib/stores/training';
    import { stats } from '$lib/stores/agent';
    import { llmState, tokenStats } from '$lib/stores/llm';
    import { ChevronDown, ChevronUp, Download, Trash2, Cpu, RefreshCw } from 'lucide-svelte';
    import {
        trainNow as doTrainNow,
        clearModel as doClearModel,
        exportTrainingData,
        exportModel,
        exportDiscoveries
    } from '$lib/core/game-init.js';

    let expanded = true;

    // Available WebLLM models
    const AVAILABLE_MODELS = [
        { id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', name: 'Qwen 2.5 1.5B', size: '~1.5GB', default: true },
        { id: 'Qwen2.5-3B-Instruct-q4f16_1-MLC', name: 'Qwen 2.5 3B', size: '~2.5GB' },
        { id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', name: 'Llama 3.2 1B', size: '~1.2GB' },
        { id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC', name: 'Llama 3.2 3B', size: '~2.5GB' },
        { id: 'Phi-3.5-mini-instruct-q4f16_1-MLC', name: 'Phi 3.5 Mini', size: '~2.4GB' },
        { id: 'SmolLM2-1.7B-Instruct-q4f16_1-MLC', name: 'SmolLM2 1.7B', size: '~1.3GB' },
    ];

    const STORAGE_KEY = 'tesserack-selected-model';
    let selectedModelId = AVAILABLE_MODELS[0].id;
    let modelChangeRequiresReload = false;

    onMount(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && AVAILABLE_MODELS.some(m => m.id === saved)) {
            selectedModelId = saved;
        }
    });

    function handleModelChange(event) {
        const newModelId = event.target.value;
        localStorage.setItem(STORAGE_KEY, newModelId);
        selectedModelId = newModelId;
        modelChangeRequiresReload = true;
    }

    function reloadForModelChange() {
        window.location.reload();
    }

    function toggleExpanded() {
        expanded = !expanded;
    }

    async function trainNow() {
        await doTrainNow();
    }

    $: selectedModel = AVAILABLE_MODELS.find(m => m.id === selectedModelId);

    function exportData() {
        const data = exportTrainingData();
        if (data) {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'tesserack-training-data.json';
            a.click();
            URL.revokeObjectURL(url);
        }
    }

    async function exportModelData() {
        const data = await exportModel();
        if (data) {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'tesserack-model.json';
            a.click();
            URL.revokeObjectURL(url);
        }
    }

    async function clearModel() {
        if (confirm('Clear the trained model? You will need to retrain.')) {
            await doClearModel();
        }
    }
</script>

<div class="advanced-panel" class:expanded>
    <button class="toggle-btn" on:click={toggleExpanded}>
        {#if expanded}
            <ChevronUp size={16} />
        {:else}
            <ChevronDown size={16} />
        {/if}
        Advanced
    </button>

    {#if expanded}
        <div class="advanced-content">
            <!-- Training Section -->
            <div class="section">
                <div class="section-title">Neural Network Training</div>
                <div class="section-content">
                    <div class="stat-row">
                        <span class="stat-label">Experiences</span>
                        <span class="stat-value">{$stats.experiences.toLocaleString()}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Training Sessions</span>
                        <span class="stat-value">{$modelState.sessions}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Policy Usage</span>
                        <span class="stat-value">{$modelState.policyUsage}%</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Next Auto-Train</span>
                        <span class="stat-value">{$modelState.nextAutoTrain.toLocaleString()} steps</span>
                    </div>

                    <div class="button-row">
                        <button class="btn-primary" on:click={trainNow}>
                            Train Now
                        </button>
                        <button class="btn-ghost" on:click={clearModel}>
                            <Trash2 size={14} />
                            Clear Model
                        </button>
                    </div>

                    <label class="toggle-row">
                        <input type="checkbox" bind:checked={$autoTrainEnabled} />
                        <span>Auto-train when threshold reached</span>
                    </label>
                </div>
            </div>

            <!-- Export Section -->
            <div class="section">
                <div class="section-title">Data Export</div>
                <div class="section-content">
                    <div class="button-row">
                        <button class="btn-ghost" on:click={exportData}>
                            <Download size={14} />
                            Export Training Data
                        </button>
                        <button class="btn-ghost" on:click={exportModelData}>
                            <Download size={14} />
                            Export Model
                        </button>
                    </div>
                </div>
            </div>

            <!-- LLM Model Section -->
            <div class="section">
                <div class="section-title">LLM Model</div>
                <div class="section-content">
                    <div class="stat-row">
                        <span class="stat-label">Status</span>
                        <span class="stat-value status-{$llmState.status}">{$llmState.status}</span>
                    </div>
                    {#if $tokenStats.requestCount > 0}
                        <div class="stat-row">
                            <span class="stat-label">Requests</span>
                            <span class="stat-value">{$tokenStats.requestCount}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Tokens Used</span>
                            <span class="stat-value">{$tokenStats.totalTokens.toLocaleString()}</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">Avg Speed</span>
                            <span class="stat-value">{$tokenStats.avgTokensPerSecond} tok/s</span>
                        </div>
                    {/if}

                    <div class="model-select-row">
                        <label for="model-select">Model</label>
                        <select id="model-select" value={selectedModelId} on:change={handleModelChange}>
                            {#each AVAILABLE_MODELS as model}
                                <option value={model.id}>
                                    {model.name} ({model.size})
                                </option>
                            {/each}
                        </select>
                    </div>

                    {#if modelChangeRequiresReload}
                        <div class="reload-notice">
                            <span>Reload required to apply model change</span>
                            <button class="btn-primary btn-small" on:click={reloadForModelChange}>
                                <RefreshCw size={12} />
                                Reload
                            </button>
                        </div>
                    {/if}
                </div>
            </div>

        </div>
    {/if}
</div>

<style>
    .advanced-panel {
        margin-top: 16px;
        border-top: 1px solid var(--border-color);
        padding-top: 16px;
    }

    .toggle-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        background: transparent;
        color: var(--text-secondary);
        font-size: 13px;
        padding: 8px 12px;
    }

    .toggle-btn:hover {
        color: var(--text-primary);
    }

    .advanced-content {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 20px;
        margin-top: 16px;
        padding: 20px;
        background: var(--bg-panel);
        border-radius: var(--border-radius);
    }

    .section-title {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--text-secondary);
        margin-bottom: 12px;
    }

    .stat-row {
        display: flex;
        justify-content: space-between;
        padding: 6px 0;
        font-size: 13px;
    }

    .stat-label {
        color: var(--text-secondary);
    }

    .stat-value {
        color: var(--text-primary);
        font-weight: 500;
    }

    .button-row {
        display: flex;
        gap: 8px;
        margin-top: 12px;
        flex-wrap: wrap;
    }

    .button-row button {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12px;
        padding: 8px 12px;
    }

    .toggle-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 12px;
        font-size: 12px;
        color: var(--text-secondary);
        cursor: pointer;
    }

    .toggle-row input {
        cursor: pointer;
    }

    .model-select-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-top: 12px;
    }

    .model-select-row label {
        font-size: 13px;
        color: var(--text-secondary);
    }

    .model-select-row select {
        flex: 1;
        max-width: 200px;
        padding: 8px 12px;
        background: var(--bg-input);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        color: var(--text-primary);
        font-size: 13px;
        cursor: pointer;
    }

    .model-select-row select:hover {
        border-color: var(--text-muted);
    }

    .model-select-row select:focus {
        outline: none;
        border-color: var(--accent-primary);
    }

    .reload-notice {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-top: 12px;
        padding: 10px 12px;
        background: rgba(116, 185, 255, 0.1);
        border: 1px solid rgba(116, 185, 255, 0.3);
        border-radius: 6px;
        font-size: 12px;
        color: var(--accent-primary);
    }

    .btn-small {
        padding: 6px 10px !important;
        font-size: 11px !important;
    }

    .status-idle { color: var(--text-muted); }
    .status-loading { color: var(--accent-primary); }
    .status-ready { color: var(--accent-success); }
    .status-error { color: var(--accent-secondary); }
</style>
