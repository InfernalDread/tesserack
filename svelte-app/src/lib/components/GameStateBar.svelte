<script>
    import { gameState } from '$lib/stores/game';
    import { labModeEnabled, isLabConnected, labData } from '$lib/stores/lab';
    import { MapPin, Users, Award } from 'lucide-svelte';

    // Use lab state when in lab mode, otherwise use browser game state
    $: useLabData = $labModeEnabled && $isLabConnected && $labData.state;
    $: state = useLabData ? $labData.state : $gameState;

    // Format party data (different structure from lab vs browser)
    $: partyDisplay = useLabData
        ? (state.party || []).map(p => `#${p.species_id} Lv${p.level}`).join(', ')
        : (state.party || []).map(p => `${p.species} Lv${p.level}`).join(', ');

    // Badge count (different format from lab vs browser)
    $: badgeCount = useLabData
        ? (state.badge_count || 0)
        : (state.badges?.length || 0);

    // Location display
    $: location = useLabData
        ? state.location || `Map ${state.map_id}`
        : (state.location || 'Unknown');

    $: coords = useLabData
        ? { x: state.player_x || 0, y: state.player_y || 0 }
        : (state.coordinates || { x: 0, y: 0 });
</script>

<div class="game-state-bar panel">
    <div class="state-item">
        <MapPin size={14} />
        <span class="label">Location</span>
        <span class="value">{location}</span>
        <span class="coords">({coords.x}, {coords.y})</span>
    </div>

    <div class="state-item">
        <Users size={14} />
        <span class="label">Party</span>
        <span class="value">
            {#if partyDisplay}
                {partyDisplay}
            {:else}
                No Pokemon
            {/if}
        </span>
    </div>

    <div class="state-item">
        <Award size={14} />
        <span class="label">Badges</span>
        <span class="value badge-count">{badgeCount}/8</span>
    </div>
</div>

<style>
    .game-state-bar {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        padding: 12px 16px;
        font-size: 12px;
    }

    .state-item {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--text-secondary);
    }

    .state-item :global(svg) {
        color: var(--text-muted);
    }

    .label {
        color: var(--text-muted);
    }

    .value {
        color: var(--text-primary);
        font-weight: 500;
    }

    .coords {
        color: var(--text-muted);
        font-size: 11px;
    }

    .badge-count {
        color: var(--accent-primary);
    }
</style>
