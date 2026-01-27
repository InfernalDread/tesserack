<script>
    import { onMount, onDestroy } from 'svelte';
    import cytoscape from 'cytoscape';
    import dagre from 'cytoscape-dagre';

    export let graphData = { nodes: [], edges: [] };
    export let currentLocation = null;
    export let completedObjectives = new Set();
    export let onNodeClick = null;

    let container;
    let cy = null;

    // Register dagre layout
    cytoscape.use(dagre);

    // Color scheme
    const colors = {
        location: '#74b9ff',
        objective: '#00cec9',
        item: '#fdcb6e',
        pokemon: '#e17055',
        trainer: '#d63031',
        requirement: '#636e72',
        current: '#00ff88',
        completed: '#00b894',
        edge: '#555',
        edgeHighlight: '#74b9ff'
    };

    function buildCytoscapeData(data) {
        const elements = [];

        // Filter to only show locations, objectives, and trainers for cleaner view
        // (items and pokemon make it too cluttered)
        const visibleTypes = ['location', 'objective', 'trainer'];
        const visibleNodes = new Set();

        // Add nodes
        for (const node of data.nodes) {
            if (!visibleTypes.includes(node.type)) continue;

            visibleNodes.add(node.id);

            const isCurrentLocation = node.name === currentLocation;
            const isCompleted = completedObjectives.has(node.name);

            let bgColor = colors[node.type] || '#999';
            if (isCurrentLocation) bgColor = colors.current;
            else if (isCompleted) bgColor = colors.completed;

            elements.push({
                data: {
                    id: node.id,
                    label: node.name,
                    type: node.type,
                    description: node.description,
                    isGymLeader: node.isGymLeader,
                    badge: node.badge,
                    bgColor,
                    borderWidth: isCurrentLocation ? 4 : (node.isGymLeader ? 3 : 1),
                    borderColor: isCurrentLocation ? '#fff' : (node.isGymLeader ? '#d63031' : '#333')
                }
            });
        }

        // Add edges (only between visible nodes)
        for (const edge of data.edges) {
            if (!visibleNodes.has(edge.from) || !visibleNodes.has(edge.to)) continue;

            // Only show leads_to and contains edges
            if (!['leads_to', 'contains', 'has_trainer'].includes(edge.type)) continue;

            elements.push({
                data: {
                    id: `${edge.from}-${edge.to}`,
                    source: edge.from,
                    target: edge.to,
                    edgeType: edge.type,
                    method: edge.method
                }
            });
        }

        return elements;
    }

    function initGraph() {
        if (!container || !graphData.nodes.length) return;

        const elements = buildCytoscapeData(graphData);

        cy = cytoscape({
            container,
            elements,
            style: [
                {
                    selector: 'node',
                    style: {
                        'label': 'data(label)',
                        'background-color': 'data(bgColor)',
                        'border-width': 'data(borderWidth)',
                        'border-color': 'data(borderColor)',
                        'color': '#fff',
                        'text-valign': 'center',
                        'text-halign': 'center',
                        'font-size': '10px',
                        'font-weight': 'bold',
                        'text-wrap': 'wrap',
                        'text-max-width': '80px',
                        'width': 'label',
                        'height': 'label',
                        'padding': '8px',
                        'shape': 'roundrectangle',
                        'text-outline-width': 2,
                        'text-outline-color': '#1a1a2e'
                    }
                },
                {
                    selector: 'node[type="location"]',
                    style: {
                        'shape': 'roundrectangle'
                    }
                },
                {
                    selector: 'node[type="objective"]',
                    style: {
                        'shape': 'ellipse',
                        'font-size': '8px'
                    }
                },
                {
                    selector: 'node[type="trainer"]',
                    style: {
                        'shape': 'diamond'
                    }
                },
                {
                    selector: 'edge',
                    style: {
                        'width': 2,
                        'line-color': colors.edge,
                        'target-arrow-color': colors.edge,
                        'target-arrow-shape': 'triangle',
                        'curve-style': 'bezier',
                        'opacity': 0.6
                    }
                },
                {
                    selector: 'edge[edgeType="leads_to"]',
                    style: {
                        'width': 3,
                        'line-color': colors.edgeHighlight,
                        'target-arrow-color': colors.edgeHighlight,
                        'opacity': 0.8
                    }
                },
                {
                    selector: 'node:selected',
                    style: {
                        'border-width': 4,
                        'border-color': '#fff'
                    }
                }
            ],
            layout: {
                name: 'dagre',
                rankDir: 'TB',
                nodeSep: 50,
                rankSep: 80,
                padding: 20
            },
            minZoom: 0.2,
            maxZoom: 3,
            wheelSensitivity: 0.3
        });

        // Click handler
        cy.on('tap', 'node', (evt) => {
            const node = evt.target.data();
            if (onNodeClick) {
                onNodeClick(node);
            }
        });

        // Fit to container
        cy.fit(undefined, 50);
    }

    function updateHighlights() {
        if (!cy) return;

        cy.nodes().forEach(node => {
            const data = node.data();
            const isCurrentLocation = data.label === currentLocation;
            const isCompleted = completedObjectives.has(data.label);

            let bgColor = colors[data.type] || '#999';
            if (isCurrentLocation) bgColor = colors.current;
            else if (isCompleted) bgColor = colors.completed;

            node.data('bgColor', bgColor);
            node.data('borderWidth', isCurrentLocation ? 4 : (data.isGymLeader ? 3 : 1));
            node.data('borderColor', isCurrentLocation ? '#fff' : (data.isGymLeader ? '#d63031' : '#333'));
        });
    }

    export function centerOnNode(nodeName) {
        if (!cy) return;
        const node = cy.nodes().filter(n => n.data('label') === nodeName);
        if (node.length) {
            cy.animate({
                center: { eles: node },
                zoom: 1.5,
                duration: 500
            });
        }
    }

    export function fitGraph() {
        if (cy) cy.fit(undefined, 50);
    }

    onMount(() => {
        initGraph();
    });

    onDestroy(() => {
        if (cy) {
            cy.destroy();
            cy = null;
        }
    });

    $: if (cy && currentLocation) {
        updateHighlights();
    }

    $: if (cy && completedObjectives) {
        updateHighlights();
    }
</script>

<div class="graph-container" bind:this={container}></div>

<style>
    .graph-container {
        width: 100%;
        height: 100%;
        min-height: 400px;
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border-radius: 8px;
        overflow: hidden;
    }
</style>
