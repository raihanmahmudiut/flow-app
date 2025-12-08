import dagre from "dagre"
import { Position } from '@vue-flow/core'

// Layer colors: deep pink -> deep orange -> green (cycling)
const LAYER_COLORS = [
    '#e91e63', // Deep Pink
    '#ff5722', // Deep Orange  
    '#4caf50', // Green
]

const CONFIG = {
    rankdir: 'TB',
    ranksep: 80,
    nodesep: 60,
    nodeWidth: 250,
    nodeHeight: 80,
    connectorWidth: 100,
    connectorHeight: 50,
}

export function getLayerColor(depth) {
    return LAYER_COLORS[depth % LAYER_COLORS.length]
}

function buildNodeMap(rawData) {
    const nodeMap = new Map()
    rawData.forEach(item => {
        nodeMap.set(item.id.toString(), item)
    })
    return nodeMap
}

function findNodesWithChildren(rawData) {
    const nodesWithChildren = new Set()
    rawData.forEach(item => {
        if (item.parentId && item.parentId !== -1) {
            nodesWithChildren.add(item.parentId.toString())
        }
    })
    return nodesWithChildren
}

function calculateDepth(nodeId, nodeMap, visited = new Set()) {
    if (visited.has(nodeId)) return 0
    visited.add(nodeId)
    
    const node = nodeMap.get(nodeId.toString())
    if (!node || !node.parentId || node.parentId === -1) {
        return 0
    }
    return 1 + calculateDepth(node.parentId.toString(), nodeMap, visited)
}

function getNodeDimensions(type) {
    const isConnector = type === 'dateTimeConnector'
    return {
        width: isConnector ? CONFIG.connectorWidth : CONFIG.nodeWidth,
        height: isConnector ? CONFIG.connectorHeight : CONFIG.nodeHeight,
    }
}

function createNode(item, depth, isLeaf) {
    return {
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
}

function createEdge(item, parentDepth, childDepth) {
    const edgeColor = getLayerColor(parentDepth)
    return {
        id: `e${item.parentId}-${item.id}`,
        source: item.parentId.toString(),
        target: item.id.toString(),
        type: 'smoothstep',
        style: { stroke: edgeColor, strokeWidth: 2 },
        data: { 
            color: edgeColor,
            sourceDepth: parentDepth,
            targetDepth: childDepth
        }
    }
}

function applyDagrePositions(nodes, dagreGraph) {
    return nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id)
        const { width, height } = getNodeDimensions(node.data.type)
        
        return {
            ...node,
            position: {
                x: nodeWithPosition.x - width / 2,
                y: nodeWithPosition.y - height / 2
            },
            targetPosition: Position.Top,
            sourcePosition: Position.Bottom
        }
    })
}

/**
 * This function transforms raw data into Vue Flow nodes and edges
 */
export function getLayoutElements(rawData) {
    // initializes the Dagre graph
    const dagreGraph = new dagre.graphlib.Graph()
    dagreGraph.setDefaultEdgeLabel(() => ({}))
    dagreGraph.setGraph({ 
        rankdir: CONFIG.rankdir, 
        ranksep: CONFIG.ranksep, 
        nodesep: CONFIG.nodesep 
    })
    
    // builds the lookup structures
    const nodeMap = buildNodeMap(rawData)
    const nodesWithChildren = findNodesWithChildren(rawData)
    
    // processes each item into nodes and edges
    const nodes = []
    const edges = []
    
    rawData.forEach((item) => {
        const id = item.id.toString()
        const depth = calculateDepth(id, nodeMap)
        const isLeaf = !nodesWithChildren.has(id)
        
        // creates and registers the node
        const node = createNode(item, depth, isLeaf)
        nodes.push(node)
        
        const { width, height } = getNodeDimensions(item.type)
        dagreGraph.setNode(node.id, { width, height })
        
        // creates an edge if the node has a parent
        if (item.parentId && item.parentId !== -1) {
            const parentDepth = calculateDepth(item.parentId.toString(), nodeMap)
            const edge = createEdge(item, parentDepth, depth)
            edges.push(edge)
            dagreGraph.setEdge(edge.source, edge.target)
        }
    })
    
    dagre.layout(dagreGraph)
    
    const layoutedNodes = applyDagrePositions(nodes, dagreGraph)

    return { nodes: layoutedNodes, edges }
}
