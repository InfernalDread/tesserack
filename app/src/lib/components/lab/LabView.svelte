<script>
    import { onMount, onDestroy } from 'svelte';
    import { Play, Pause, RotateCcw, Save, FolderOpen, FastForward, SkipForward, ChevronDown } from 'lucide-svelte';
    import LabCanvas from './LabCanvas.svelte';
    import ModeToggle from './ModeToggle.svelte';
    import HyperparamsPopover from './HyperparamsPopover.svelte';
    import MetricsChart from './MetricsChart.svelte';
    import RewardBar from './RewardBar.svelte';
    import {
        walkthroughGraph,
        currentGraphLocation,
        completedObjectives,
        labMetrics,
        graphStats,
        completionPercentage,
        loadWalkthroughGraph,
        resetMetrics,
        rlConfig
    } from '$lib/stores/lab';
    import {
        startLabAgent,
        stopLabAgent,
        resetLab,
        getLabInstances,
        setLabSpeed,
        stepLabAgent,
        setLabMode,
        labMode,
        pureRLMetrics,
        updateRLConfig
    } from '$lib/core/lab/lab-init.js';
    import { feedSystem } from '$lib/stores/feed';

    let isRunning = false;
    let labInitialized = false;
    let hyperparamsOpen = false;

    // Mode: 'play' (LLM) or 'train' (RL)
    $: mode = $labMode === 'purerl' ? 'train' : 'play';

    // Playback controls
    let playbackSpeed = 1;
    const speeds = [1, 2, 4, 8];

    // Save states
    let savedStates = [];
    let showSaveStates = false;

    // Algorithm options (for future PPO etc)
    const algorithms = [
        { id: 'reinforce', label: 'REINFORCE' },
        // { id: 'ppo', label: 'PPO' }, // Future
    ];
    let selectedAlgorithm = 'reinforce';
    let showAlgorithmDropdown = false;

    // Guide context for Play mode
    $: guideContext = buildGuideContext($currentGraphLocation, $walkthroughGraph, $completedObjectives);

    function buildGuideContext(locationName, graph, completed) {
        if (!graph?.nodes?.length || !locationName) return null;

        const location = graph.nodes.find(n =>
            n.type === 'location' &&
            (n.name.toLowerCase() === locationName.toLowerCase() ||
             n.name.toLowerCase().includes(locationName.toLowerCase()))
        );

        if (!location) return null;

        const objectives = [];
        for (const edge of graph.edges) {
            if (edge.from === location.id && edge.type === 'contains') {
                const target = graph.nodes.find(n => n.id === edge.to);
                if (target?.type === 'objective' && !completed.has(target.name)) {
                    objectives.push(target);
                }
            }
        }

        return {
            location: location.name,
            description: location.description || '',
            objectives: objectives.slice(0, 4)
        };
    }

    onMount(async () => {
        await loadWalkthroughGraph();
        // Load saved states
        try {
            const stored = localStorage.getItem('tesserack_lab_states');
            if (stored) savedStates = JSON.parse(stored);
        } catch (e) {}
    });

    onDestroy(() => {
        if (isRunning) stopLabAgent();
    });

    function handleLabInitialized() {
        labInitialized = true;
        feedSystem('Lab ready. Select Play or Train mode.');
    }

    function handleModeChange(event) {
        const newMode = event.detail.mode;
        if (isRunning) {
            stopLabAgent();
            isRunning = false;
        }
        setLabMode(newMode === 'train' ? 'purerl' : 'llm');
    }

    function toggleRun() {
        if (!labInitialized) {
            feedSystem('Please wait for Lab to initialize...');
            return;
        }

        isRunning = !isRunning;

        if (isRunning) {
            startLabAgent();
            feedSystem(mode === 'train' ? 'Training started...' : 'Playing with LLM guidance...');
        } else {
            stopLabAgent();
            feedSystem('Paused.');
        }
    }

    function handleReset() {
        stopLabAgent();
        resetLab();
        resetMetrics();
        isRunning = false;
        feedSystem('Reset complete.');
    }

    function stepOnce() {
        if (!labInitialized || isRunning) return;
        stepLabAgent();
    }

    function cycleSpeed() {
        const idx = speeds.indexOf(playbackSpeed);
        playbackSpeed = speeds[(idx + 1) % speeds.length];
        setLabSpeed(playbackSpeed);
    }

    // Save/Load state helpers
    function uint8ArrayToBase64(arr) {
        let binary = '';
        for (let i = 0; i < arr.byteLength; i++) {
            binary += String.fromCharCode(arr[i]);
        }
        return btoa(binary);
    }

    function base64ToUint8Array(base64) {
        const binary = atob(base64);
        const arr = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            arr[i] = binary.charCodeAt(i);
        }
        return arr;
    }

    async function saveState() {
        if (!labInitialized) return;
        const { emulator } = getLabInstances();
        if (!emulator) return;

        try {
            const state = emulator.saveState();
            const newState = {
                id: Date.now(),
                name: `State ${savedStates.length + 1}`,
                timestamp: new Date().toISOString(),
                location: $currentGraphLocation,
                data: uint8ArrayToBase64(state)
            };
            savedStates = [...savedStates, newState];
            localStorage.setItem('tesserack_lab_states', JSON.stringify(savedStates));
            feedSystem(`Saved: ${newState.name}`);
        } catch (e) {
            feedSystem(`Save failed: ${e.message}`);
        }
    }

    async function loadState(state) {
        if (!labInitialized) return;
        const { emulator } = getLabInstances();
        if (!emulator) return;

        try {
            emulator.loadState(base64ToUint8Array(state.data));
            feedSystem(`Loaded: ${state.name}`);
            showSaveStates = false;
        } catch (e) {
            feedSystem(`Load failed: ${e.message}`);
        }
    }

    function deleteState(state) {
        savedStates = savedStates.filter(s => s.id !== state.id);
        localStorage.setItem('tesserack_lab_states', JSON.stringify(savedStates));
    }

    function handleHyperparamsApply(event) {
        const { learningRate, rolloutSize, gamma } = event.detail;
        updateRLConfig({ learningRate, rolloutSize, gamma });
    }

    // Format helpers
    function formatReward(r) {
        if (r > 0) return '+' + r.toFixed(3);
        if (r < 0) return r.toFixed(3);
        return '0.000';
    }

    function rewardClass(r) {
        if (r > 0) return 'positive';
        if (r < 0) return 'negative';
        return 'neutral';
    }
</script>

<div class="lab-view">
    <!-- Header -->
    <header class="lab-header">
        <div class="header-left">
            <ModeToggle {mode} disabled={isRunning} on:change={handleModeChange} />

            {#if mode === 'train'}
                <!-- Algorithm Dropdown -->
                <div class="algorithm-dropdown">
                    <button
                        class="dropdown-trigger"
                        on:click={() => showAlgorithmDropdown = !showAlgorithmDropdown}
                        disabled={isRunning}
                    >
                        <span>{algorithms.find(a => a.id === selectedAlgorithm)?.label}</span>
                        <ChevronDown size={14} />
                    </button>
                    {#if showAlgorithmDropdown}
                        <div class="dropdown-menu">
                            {#each algorithms as algo}
                                <button
                                    class="dropdown-item"
                                    class:active={selectedAlgorithm === algo.id}
                                    on:click={() => { selectedAlgorithm = algo.id; showAlgorithmDropdown = false; }}
                                >
                                    {algo.label}
                                </button>
                            {/each}
                        </div>
                    {/if}
                </div>

                <HyperparamsPopover
                    bind:open={hyperparamsOpen}
                    disabled={isRunning}
                    on:apply={handleHyperparamsApply}
                />
            {/if}
        </div>

        <div class="header-right">
            <button class="header-btn" on:click={saveState} title="Save state">
                <Save size={16} />
            </button>
            <div class="save-states-container">
                <button
                    class="header-btn"
                    class:active={showSaveStates}
                    on:click={() => showSaveStates = !showSaveStates}
                    title="Load state"
                >
                    <FolderOpen size={16} />
                </button>
                {#if showSaveStates}
                    <div class="states-dropdown">
                        {#if savedStates.length > 0}
                            {#each savedStates as state}
                                <div class="state-item">
                                    <button class="state-load" on:click={() => loadState(state)}>
                                        <span class="state-name">{state.name}</span>
                                        <span class="state-location">{state.location}</span>
                                    </button>
                                    <button class="state-delete" on:click={() => deleteState(state)}>×</button>
                                </div>
                            {/each}
                        {:else}
                            <div class="states-empty">No saved states</div>
                        {/if}
                    </div>
                {/if}
            </div>

            <div class="header-divider"></div>

            <button class="header-btn speed" on:click={cycleSpeed} title="Playback speed">
                <FastForward size={16} />
                <span>{playbackSpeed}x</span>
            </button>
            <button
                class="header-btn"
                on:click={stepOnce}
                disabled={isRunning || !labInitialized}
                title="Step once"
            >
                <SkipForward size={16} />
            </button>
            <button class="header-btn" on:click={handleReset} title="Reset">
                <RotateCcw size={16} />
            </button>

            <button class="run-btn" class:running={isRunning} on:click={toggleRun}>
                {#if isRunning}
                    <Pause size={18} />
                    <span>Pause</span>
                {:else}
                    <Play size={18} />
                    <span>Run</span>
                {/if}
            </button>
        </div>
    </header>

    <!-- Main Content -->
    <div class="main-content">
        <!-- Game Canvas (60%) -->
        <div class="game-area">
            <div class="canvas-wrapper">
                <LabCanvas on:initialized={handleLabInitialized} />
            </div>
        </div>

        <!-- Metrics Panel (40%) -->
        <div class="metrics-panel">
            {#if mode === 'train'}
                <!-- Train Mode Metrics -->
                <div class="metrics-section">
                    <div class="metric-row">
                        <span class="metric-label">Step</span>
                        <span class="metric-value mono">{$pureRLMetrics.step.toLocaleString()}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Action</span>
                        <span class="metric-value action-badge">{$pureRLMetrics.action || '-'}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Updates</span>
                        <span class="metric-value mono">{$pureRLMetrics.trainSteps}</span>
                    </div>
                </div>

                <div class="metrics-divider"></div>

                <div class="metrics-section">
                    <div class="metric-row">
                        <span class="metric-label">Buffer</span>
                        <span class="metric-value mono">{$pureRLMetrics.bufferFill}/{$pureRLMetrics.bufferSize}</span>
                    </div>
                    <div class="buffer-bar">
                        <div
                            class="buffer-fill"
                            style="width: {($pureRLMetrics.bufferFill / $pureRLMetrics.bufferSize) * 100}%"
                        ></div>
                    </div>
                </div>

                <div class="metrics-divider"></div>

                <div class="metrics-section">
                    <div class="metric-row">
                        <span class="metric-label">Avg Return</span>
                        <span class="metric-value mono {rewardClass($pureRLMetrics.avgRawReturn)}">
                            {formatReward($pureRLMetrics.avgRawReturn)}
                        </span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Entropy</span>
                        <span class="metric-value mono">{$pureRLMetrics.policyEntropy.toFixed(3)}</span>
                    </div>
                </div>

                <div class="metrics-divider"></div>

                <!-- Chart -->
                <div class="chart-section">
                    <MetricsChart history={$pureRLMetrics.history} />
                </div>

            {:else}
                <!-- Play Mode Metrics -->
                <div class="metrics-section">
                    <div class="metric-row">
                        <span class="metric-label">Steps</span>
                        <span class="metric-value mono">{$labMetrics.totalSteps.toLocaleString()}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">LLM Calls</span>
                        <span class="metric-value mono">{$labMetrics.llmCalls}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Objectives</span>
                        <span class="metric-value mono">{$labMetrics.objectivesCompleted}/{$graphStats.objectives}</span>
                    </div>
                </div>

                <div class="metrics-divider"></div>

                <!-- Guide Context -->
                <div class="guide-section">
                    <div class="guide-header">Current Guide Context</div>
                    {#if guideContext}
                        <div class="guide-location">{guideContext.location}</div>
                        {#if guideContext.description}
                            <p class="guide-desc">{guideContext.description}</p>
                        {/if}
                        {#if guideContext.objectives.length > 0}
                            <ul class="guide-objectives">
                                {#each guideContext.objectives as obj}
                                    <li>{obj.name}</li>
                                {/each}
                            </ul>
                        {/if}
                    {:else}
                        <p class="guide-empty">No context for current location</p>
                    {/if}
                </div>
            {/if}
        </div>
    </div>

    <!-- Bottom Bar -->
    <div class="bottom-bar">
        {#if mode === 'train'}
            <RewardBar breakdown={$pureRLMetrics.breakdown} />
        {:else}
            <div class="progress-bar-container">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: {$completionPercentage}%"></div>
                </div>
                <span class="progress-label">{$completionPercentage}% complete</span>
            </div>
        {/if}
    </div>
</div>

<style>
    .lab-view {
        display: flex;
        flex-direction: column;
        height: 100%;
        gap: 12px;
        padding: 12px;
        background: var(--bg-main);
    }

    /* Header */
    .lab-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background: var(--bg-panel);
        border-radius: 8px;
        gap: 8px;
        flex-wrap: wrap;
        position: relative;
        z-index: 10;
    }

    .header-left, .header-right {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
    }

    .header-left {
        flex-wrap: wrap;
    }

    .header-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 8px;
        border: none;
        border-radius: 6px;
        background: var(--bg-input);
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.15s;
    }

    .header-btn:hover:not(:disabled) {
        background: var(--bg-panel);
        color: var(--text-primary);
    }

    .header-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }

    .header-btn.active {
        background: var(--accent-primary);
        color: white;
    }

    .header-btn.speed {
        padding: 6px 10px;
        font-size: 11px;
        font-weight: 600;
    }

    /* Responsive header */
    @media (max-width: 800px) {
        .lab-header {
            padding: 6px 8px;
        }

        .header-left, .header-right {
            gap: 4px;
        }

        .header-btn {
            padding: 6px;
        }

        .run-btn {
            padding: 6px 10px;
        }

        .run-btn span {
            display: none;
        }

        .header-divider {
            display: none;
        }
    }

    .header-divider {
        width: 1px;
        height: 24px;
        background: var(--border-color);
    }

    .run-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 8px 12px;
        border: none;
        border-radius: 6px;
        background: var(--accent-primary);
        color: white;
        flex-shrink: 0;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s;
    }

    .run-btn:hover {
        filter: brightness(1.1);
    }

    .run-btn.running {
        background: #e17055;
    }

    /* Algorithm Dropdown */
    .algorithm-dropdown {
        position: relative;
    }

    .dropdown-trigger {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        background: var(--bg-input);
        color: var(--text-primary);
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
    }

    .dropdown-trigger:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .dropdown-menu {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        min-width: 120px;
        background: var(--bg-panel);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 100;
        overflow: hidden;
    }

    .dropdown-item {
        display: block;
        width: 100%;
        padding: 8px 12px;
        border: none;
        background: transparent;
        color: var(--text-secondary);
        font-size: 12px;
        text-align: left;
        cursor: pointer;
    }

    .dropdown-item:hover {
        background: var(--bg-input);
        color: var(--text-primary);
    }

    .dropdown-item.active {
        background: var(--accent-primary);
        color: white;
    }

    /* Save States */
    .save-states-container {
        position: relative;
    }

    .states-dropdown {
        position: absolute;
        top: calc(100% + 4px);
        right: 0;
        width: 180px;
        max-height: 200px;
        overflow-y: auto;
        background: var(--bg-panel);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 100;
    }

    .state-item {
        display: flex;
        align-items: center;
        border-bottom: 1px solid var(--border-color);
    }

    .state-item:last-child {
        border-bottom: none;
    }

    .state-load {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        padding: 8px 10px;
        background: none;
        border: none;
        cursor: pointer;
        color: var(--text-primary);
    }

    .state-load:hover {
        background: var(--bg-input);
    }

    .state-name {
        font-size: 12px;
        font-weight: 500;
    }

    .state-location {
        font-size: 10px;
        color: var(--text-muted);
    }

    .state-delete {
        padding: 8px;
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        font-size: 16px;
    }

    .state-delete:hover {
        color: #d63031;
    }

    .states-empty {
        padding: 12px;
        text-align: center;
        color: var(--text-muted);
        font-size: 12px;
    }

    /* Main Content */
    .main-content {
        flex: 1;
        display: flex;
        gap: 12px;
        min-height: 0;
    }

    .game-area {
        flex: 6;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-panel);
        border-radius: 8px;
        padding: 12px;
        overflow: hidden;
    }

    .canvas-wrapper {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        overflow: hidden;
        border: 2px solid var(--border-color);
    }

    /* Metrics Panel */
    .metrics-panel {
        flex: 4;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 16px;
        background: var(--bg-panel);
        border-radius: 8px;
        overflow-y: auto;
    }

    .metrics-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .metrics-divider {
        height: 1px;
        background: var(--border-color);
        margin: 4px 0;
    }

    .metric-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .metric-label {
        font-size: 12px;
        color: var(--text-muted);
    }

    .metric-value {
        font-size: 13px;
        font-weight: 600;
        color: var(--text-primary);
    }

    .metric-value.mono {
        font-family: 'Monaco', 'Menlo', monospace;
    }

    .metric-value.positive {
        color: #00b894;
    }

    .metric-value.negative {
        color: #d63031;
    }

    .action-badge {
        display: inline-block;
        padding: 2px 8px;
        background: var(--accent-primary);
        color: white;
        border-radius: 4px;
        font-size: 11px;
        text-transform: uppercase;
    }

    .buffer-bar {
        width: 100%;
        height: 6px;
        background: var(--bg-input);
        border-radius: 3px;
        overflow: hidden;
    }

    .buffer-fill {
        height: 100%;
        background: var(--accent-primary);
        border-radius: 3px;
        transition: width 0.15s ease-out;
    }

    .chart-section {
        flex: 1;
        min-height: 180px;
    }

    /* Guide Section (Play mode) */
    .guide-section {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .guide-header {
        font-size: 11px;
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .guide-location {
        font-size: 14px;
        font-weight: 600;
        color: var(--accent-primary);
    }

    .guide-desc {
        font-size: 12px;
        color: var(--text-secondary);
        margin: 0;
        line-height: 1.5;
    }

    .guide-objectives {
        margin: 0;
        padding-left: 16px;
        font-size: 12px;
        color: var(--text-secondary);
    }

    .guide-objectives li {
        margin: 4px 0;
    }

    .guide-empty {
        font-size: 12px;
        color: var(--text-muted);
        font-style: italic;
        margin: 0;
    }

    /* Bottom Bar */
    .bottom-bar {
        flex-shrink: 0;
    }

    .progress-bar-container {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: var(--bg-panel);
        border-radius: 8px;
    }

    .progress-bar {
        flex: 1;
        height: 8px;
        background: var(--bg-input);
        border-radius: 4px;
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        background: var(--accent-primary);
        border-radius: 4px;
        transition: width 0.3s ease-out;
    }

    .progress-label {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-secondary);
        white-space: nowrap;
    }
</style>
