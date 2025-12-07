import dagre from "dagre"
import { Position } from '@vue-flow/core'

// Layer colors: deep pink -> deep orange -> green (cycling)
const LAYER_COLORS = [
    '#e91e63', // Deep Pink
    '#ff5722', // Deep Orange  
    '#4caf50', // Green
]

export function getLayerColor(depth) {
    return LAYER_COLORS[depth % LAYER_COLORS.length]
}

export function getLayoutElements(rawData) {
    const dagreGraph = new dagre.graphlib.Graph()

    dagreGraph.setDefaultEdgeLabel(() => ({}))
    
    dagreGraph.setGraph({ rankdir: 'TB', ranksep: 80, nodesep: 60 })
    
    const nodes = []
    const edges = []
    
    // Build a map for quick lookup
    const nodeMap = new Map()
    rawData.forEach(item => {
        nodeMap.set(item.id.toString(), item)
    })

    // Calculate depth for each node
    function calculateDepth(nodeId, visited = new Set()) {
        if (visited.has(nodeId)) return 0
        visited.add(nodeId)
        
        const node = nodeMap.get(nodeId.toString())
        if (!node || !node.parentId || node.parentId === -1) {
            return 0
        }
        return 1 + calculateDepth(node.parentId.toString(), visited)
    }

    // Find leaf nodes (nodes with no children)
    const nodesWithChildren = new Set()
    rawData.forEach(item => {
        if (item.parentId && item.parentId !== -1) {
            nodesWithChildren.add(item.parentId.toString())
        }
    })

    rawData.forEach((item) => {
        const depth = calculateDepth(item.id.toString())
        const isLeaf = !nodesWithChildren.has(item.id.toString())
        
        // A. Create the Node
        const node = {
            id: item.id.toString(),
            type: 'custom',
            data: { 
                ...item,
                depth,
                layerColor: getLayerColor(depth),
                isLeaf
            },
            position: { x: 0, y: 0 },
        }
        
        nodes.push(node)
        
        // Smaller size for connector nodes
        const isConnector = item.type === 'dateTimeConnector'
        dagreGraph.setNode(node.id, { 
            width: isConnector ? 100 : 250, 
            height: isConnector ? 50 : 80 
        })
        
        if (item.parentId && item.parentId !== -1) {
            const parentDepth = calculateDepth(item.parentId.toString())
            const edgeColor = getLayerColor(parentDepth)
            
            const edgeId = `e${item.parentId}-${item.id}`
            const edge = {
                id: edgeId,
                source: item.parentId.toString(),
                target: item.id.toString(),
                type: 'smoothstep',
                style: { stroke: edgeColor, strokeWidth: 2 },
                data: { 
                    color: edgeColor,
                    sourceDepth: parentDepth,
                    targetDepth: depth
                }
            }
            edges.push(edge)
            dagreGraph.setEdge(edge.source, edge.target)
        }
    })
    
    dagre.layout(dagreGraph)

    const layoutedNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id)
        const isConnector = node.data.type === 'dateTimeConnector'
        return {
            ...node,
            position: {
                x: nodeWithPosition.x - (isConnector ? 50 : 125),
                y: nodeWithPosition.y - (isConnector ? 25 : 40)
            },
            targetPosition: Position.Top,
            sourcePosition: Position.Bottom
        }
    })

    return { nodes: layoutedNodes, edges }
}
