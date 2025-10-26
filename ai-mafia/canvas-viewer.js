// Canvas Viewer - Parses Obsidian Canvas JSON and renders with Cytoscape.js

class CanvasViewer {
    constructor(containerId, canvasDataPath) {
        this.containerId = containerId;
        this.canvasDataPath = canvasDataPath;
        this.cy = null;
        this.selectedNodeId = null;
    }

    async init() {
        // Load canvas data
        const response = await fetch(this.canvasDataPath);
        
        if (!response.ok) {
            throw new Error(`Failed to load canvas data: ${response.status} ${response.statusText}`);
        }
        
        const canvasData = await response.json();
        
        // Parse and transform data
        const elements = this.parseCanvasData(canvasData);
        
        // Initialize Cytoscape
        this.cy = cytoscape({
            container: document.getElementById(this.containerId),
            elements: elements,
            style: this.getCytoscapeStyle(),
            layout: { name: 'preset' },
            minZoom: 0.1,
            maxZoom: 2.0,
            wheelSensitivity: 0.2
        });

        // Fit to viewport on initial load
        this.fitView();
        
        // Add event listeners
        this.setupInteractions();
    }

    parseCanvasData(canvasData) {
        const elements = { nodes: [], edges: [] };
        const nodeMap = new Map();
        
        // First pass: create all nodes (including groups)
        canvasData.nodes.forEach(node => {
            if (node.type === 'text' || node.type === 'file' || node.type === 'group') {
                const cytoscapeNode = this.parseNode(node);
                if (cytoscapeNode) {
                    elements.nodes.push(cytoscapeNode);
                    nodeMap.set(node.id, cytoscapeNode);
                }
            }
        });

        // Second pass: create edges
        canvasData.edges.forEach(edge => {
            const fromNode = nodeMap.get(edge.fromNode);
            const toNode = nodeMap.get(edge.toNode);
            
            if (fromNode && toNode) {
                elements.edges.push({
                    data: {
                        id: edge.id,
                        source: edge.fromNode,
                        target: edge.toNode,
                        label: edge.label || ''
                    }
                });
            }
        });

        return elements;
    }

    parseNode(node) {
        const position = { x: node.x || 0, y: node.y || 0 };
        
        // Handle file nodes (images)
        if (node.type === 'file') {
            const imagePath = this.getImagePath(node.file);
            return {
                data: {
                    id: node.id,
                    label: '',
                    type: 'image',
                    imagePath: imagePath,
                    width: node.width || 60,
                    height: node.height || 60
                },
                position: position
            };
        }
        
        // Handle text nodes
        if (node.type === 'text') {
            // Strip HTML tags for cleaner display
            const text = node.text.replace(/<[^>]*>/g, '').trim();
            const color = node.color || 'default';
            
            return {
                data: {
                    id: node.id,
                    label: text,
                    type: 'text',
                    color: color,
                    width: node.width || 250,
                    height: node.height || 60
                },
                position: position
            };
        }
        
        // Handle group nodes
        if (node.type === 'group') {
            return {
                data: {
                    id: node.id,
                    label: node.label || '',
                    type: 'group',
                    width: node.width || 300,
                    height: node.height || 100
                },
                position: position
            };
        }
        
        return null;
    }

    getImagePath(filePath) {
        // Extract filename from path like "AI Mafia/openai.png"
        const filename = filePath.split('/').pop();
        return `images/${filename}`;
    }

    getCytoscapeStyle() {
        return [
            // Default node style
            {
                selector: 'node',
                style: {
                    'label': 'data(label)',
                    'text-valign': 'center',
                    'text-halign': 'center',
                    'text-wrap': 'wrap',
                    'text-max-width': '250px',
                    'font-size': '18px',
                    'font-family': 'Inter, sans-serif',
                    'background-color': '#1d1d1d',
                    'color': '#e0e0e0',
                    'border-width': 2,
                    'border-color': '#444',
                    'shape': 'round-rectangle',
                    'padding': '10px'
                }
            },
            // Image nodes
            {
                selector: 'node[type = "image"]',
                style: {
                    'background-image': function(ele) {
                        return 'url("' + ele.data('imagePath') + '")';
                    },
                    'background-fit': 'contain',
                    'background-color': 'transparent',
                    'border-width': 0,
                    'width': function(ele) { return (ele.data('width') * 1.1) + 'px'; },
                    'height': function(ele) { return (ele.data('height') * 1.1) + 'px'; },
                    'label': '' // No label for image nodes
                }
            },
            // Text nodes with different colors
            {
                selector: 'node[type = "text"]',
                style: {
                    'width': function(ele) { return ele.data('width') + 'px'; },
                    'height': function(ele) { return ele.data('height') + 'px'; },
                    'background-color': function(ele) {
                        const color = ele.data('color');
                        const colorMap = {
                            'default': '#2d2d2d',
                            '1': '#1a472a', // Dark green
                            '4': '#2d3a50', // Dark blue
                            '5': '#4d2d3a', // Dark purple
                            '6': '#3d3d1a'  // Dark yellow/green
                        };
                        return colorMap[color] || colorMap['default'];
                    }
                }
            },
            // Group nodes
            {
                selector: 'node[type = "group"]',
                style: {
                    'width': function(ele) { return ele.data('width') + 'px'; },
                    'height': function(ele) { return ele.data('height') + 'px'; },
                    'background-color': 'rgba(74, 199, 201, 0.28)',
                    'border-color': '#87CEEB',
                    'border-width': 3,
                    'border-style': 'dashed',
                    'shape': 'round-rectangle',
                    'font-size': '20px',
                    'font-weight': 'bold'
                }
            },
            // Selected node style
            {
                selector: 'node:selected',
                style: {
                    'border-width': 3,
                    'border-color': '#87CEEB',
                    'background-color': '#3d3d3d'
                }
            },
            // Hover style
            {
                selector: 'node:active',
                style: {
                    'overlay-padding': '10px',
                    'overlay-opacity': 0.2
                }
            },
            // Edge styles
            {
                selector: 'edge',
                style: {
                    'width': 2,
                    'line-color': '#555',
                    'target-arrow-color': '#555',
                    'target-arrow-shape': 'triangle',
                    'curve-style': 'bezier',
                    'label': 'data(label)',
                    'font-size': '24px',
                    'text-rotation': 'autorotate',
                    'text-margin-y': -10,
                    'text-background-color': '#1a1a1a',
                    'text-background-opacity': 0.8,
                    'text-background-padding': '3px',
                    'text-border-color': '#555',
                    'text-border-width': 1,
                    'color': '#aaa'
                }
            },
            // Highlighted edges
            {
                selector: 'edge:selected',
                style: {
                    'width': 3,
                    'line-color': '#87CEEB',
                    'target-arrow-color': '#87CEEB'
                }
            }
        ];
    }

    setupInteractions() {
        const self = this;
        
        // Node click - highlight node and connected edges
        this.cy.on('click', 'node', function(evt) {
            const node = evt.target;
            
            // Deselect all nodes
            self.cy.elements().unselect();
            
            // Select clicked node
            node.select();
            self.selectedNodeId = node.id();
            
            // Highlight connected elements
            const connectedEdges = node.connectedEdges();
            const connectedNodes = node.neighborhood('node');
            
            connectedEdges.select();
            
            // Center view on selected node
            self.cy.animate({
                center: { eles: node },
                zoom: Math.max(self.cy.zoom(), 1.0)
            }, {
                duration: 300
            });
        });
        
        // Click on background to deselect
        this.cy.on('tap', function(evt) {
            if (evt.target === self.cy) {
                self.cy.elements().unselect();
                self.selectedNodeId = null;
            }
        });
        
        // Pan with mouse drag
        this.cy.panningEnabled(true);
        this.cy.userPanningEnabled(true);
        this.cy.boxSelectionEnabled(false);
    }

    fitView() {
        this.cy.fit(undefined, 50); // 50px padding
    }

    zoomIn() {
        this.cy.zoom(this.cy.zoom() * 1.3);
    }

    zoomOut() {
        this.cy.zoom(this.cy.zoom() / 1.3);
    }

    resetView() {
        this.fitView();
        this.cy.elements().unselect();
        this.selectedNodeId = null;
    }
}
