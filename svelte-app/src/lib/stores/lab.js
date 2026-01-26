// Lab connection store - manages WebSocket connection to Python lab
import { writable, derived, get } from 'svelte/store';
import { feedLabTask, feedLabLLM, feedLabCheckpoint, feedSystem } from './feed.js';

// Connection state: 'disconnected' | 'connecting' | 'connected' | 'error'
export const connectionState = writable('disconnected');

// Lab mode enabled
export const labModeEnabled = writable(false);

// Connection URL
export const labServerUrl = writable('ws://localhost:8765');

// Server status
export const serverStatus = writable({
    experimentName: '',
    isRunning: false,
    isPaused: false,
    speed: 1,
    totalSteps: 0,
    currentCheckpoint: 0,
    currentTask: null,
});

// Latest data from lab
export const labData = writable({
    frame: null, // Base64 PNG
    state: null, // Game state dict
    llmRequest: null, // { prompt, objective }
    llmResponse: null, // { response, task }
    taskUpdate: null, // { type, target, status, steps, budget }
    checkpoint: null, // { id, name }
    metrics: null, // { total_steps, epsilon, checkpoint }
});

// WebSocket instance (not reactive)
let ws = null;
let reconnectTimer = null;

// Connect to lab server
export function connectToLab(url = 'ws://localhost:8765') {
    if (ws && ws.readyState === WebSocket.OPEN) {
        console.log('[Lab] Already connected');
        return;
    }

    labServerUrl.set(url);
    connectionState.set('connecting');

    try {
        ws = new WebSocket(url);

        ws.onopen = () => {
            console.log('[Lab] Connected to', url);
            connectionState.set('connected');
            feedSystem('Connected to lab server');
            if (reconnectTimer) {
                clearTimeout(reconnectTimer);
                reconnectTimer = null;
            }
        };

        ws.onmessage = (event) => {
            handleMessage(JSON.parse(event.data));
        };

        ws.onclose = () => {
            console.log('[Lab] Disconnected');
            connectionState.set('disconnected');
            ws = null;

            // Auto-reconnect if lab mode is still enabled
            if (get(labModeEnabled) && !reconnectTimer) {
                reconnectTimer = setTimeout(() => {
                    reconnectTimer = null;
                    connectToLab(url);
                }, 3000);
            }
        };

        ws.onerror = (error) => {
            console.error('[Lab] WebSocket error:', error);
            connectionState.set('error');
            feedSystem('Failed to connect to lab server');
        };
    } catch (error) {
        console.error('[Lab] Failed to connect:', error);
        connectionState.set('error');
    }
}

// Disconnect from lab
export function disconnectFromLab() {
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
    if (ws) {
        ws.close();
        ws = null;
    }
    connectionState.set('disconnected');
}

// Send command to lab
export function sendCommand(command, value = null) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        console.warn('[Lab] Not connected');
        return;
    }

    const msg = {
        type: 'command',
        command,
        ...(value !== null && { value }),
    };

    ws.send(JSON.stringify(msg));
}

// Control commands
export function pauseLab() {
    sendCommand('pause');
}

export function resumeLab() {
    sendCommand('resume');
}

export function setLabSpeed(speed) {
    sendCommand('set_speed', speed);
}

export function stepLab() {
    sendCommand('step');
}

// Handle incoming messages
function handleMessage(msg) {
    const { type, data } = msg;

    switch (type) {
        case 'frame':
            labData.update(d => ({ ...d, frame: data.frame }));
            break;

        case 'state':
            labData.update(d => ({ ...d, state: data }));
            break;

        case 'llm_request':
            labData.update(d => ({ ...d, llmRequest: data }));
            feedLabLLM(data.objective);
            break;

        case 'llm_response':
            labData.update(d => ({ ...d, llmResponse: data }));
            break;

        case 'task_update':
            labData.update(d => ({ ...d, taskUpdate: data }));
            // Only feed completed/failed tasks (not active ones)
            if (data.status === 'completed' || data.status === 'failed') {
                feedLabTask(data.type, data.target, data.status);
            }
            break;

        case 'checkpoint':
            labData.update(d => ({ ...d, checkpoint: data }));
            feedLabCheckpoint(data.id, data.name);
            break;

        case 'metrics':
            labData.update(d => ({ ...d, metrics: data }));
            break;

        case 'status':
            serverStatus.update(s => ({
                ...s,
                ...(data.paused !== undefined && { isPaused: data.paused }),
                ...(data.speed !== undefined && { speed: data.speed }),
                ...(data.experiment_name !== undefined && { experimentName: data.experiment_name }),
                ...(data.is_running !== undefined && { isRunning: data.is_running }),
            }));
            break;

        default:
            console.log('[Lab] Unknown message type:', type, data);
    }
}

// Derived: is connected?
export const isLabConnected = derived(connectionState, $state => $state === 'connected');
