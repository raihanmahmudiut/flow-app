import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useHistory } from '../composables/useHistory'
import { getLayoutElements } from '../utils/useLayout'

export const useFlowStore = defineStore('flow', () => {
    const nodes = ref([])
    const edges = ref([])
    
    // History management
    const history = useHistory(50)
    const canUndo = computed(() => history.canUndo.value)
    const canRedo = computed(() => history.canRedo.value)

    
     //Gets current state snapshot
    function getSnapshot() {
        return {
            nodes: JSON.parse(JSON.stringify(nodes.value)),
            edges: JSON.parse(JSON.stringify(edges.value))
        }
    }

     //Restores state from snapshot
    function restoreSnapshot(snapshot) {
        nodes.value = snapshot.nodes
        edges.value = snapshot.edges
    }

     //Records current state before making changes
    function recordState() {
        history.record(getSnapshot())
    }

     //Initializes history with current state
    function initHistory() {
        history.init(getSnapshot())
    }

    function setNodes(newNodes) {
        nodes.value = newNodes
    }
    
    function setEdges(newEdges) {
        edges.value = newEdges
    }

     //Sets nodes with history recording
    function setNodesWithHistory(newNodes) {
        recordState()
        nodes.value = newNodes
    }

     //Sets edges with history recording
    function setEdgesWithHistory(newEdges) {
        recordState()
        edges.value = newEdges
    }

     //Updates a single node's data with history
    function updateNode(nodeId, updates) {
        recordState()
        const node = nodes.value.find(n => n.id === nodeId)
        if (node) {
            Object.assign(node.data, updates)
        }
    }

     //Updates node position with history
    function updateNodePosition(nodeId, position) {
        recordState()
        const node = nodes.value.find(n => n.id === nodeId)
        if (node) {
            node.position = { ...position }
        }
    }

    function removeNode(id) {
        recordState()
        
        // Get the node to check if it has children (for cascading delete)
        const nodeToDelete = nodes.value.find(n => n.id === id)
        if (!nodeToDelete) return
        
        // Find all descendant nodes (children, grandchildren, etc.)
        const nodesToDelete = new Set([id])
        let foundMore = true
        while (foundMore) {
            foundMore = false
            nodes.value.forEach(n => {
                const parentId = n.data?.parentId?.toString()
                if (parentId && nodesToDelete.has(parentId) && !nodesToDelete.has(n.id)) {
                    nodesToDelete.add(n.id)
                    foundMore = true
                }
            })
        }
        
        // Filter out deleted nodes and get remaining raw data
        const remainingRawData = nodes.value
            .filter(n => !nodesToDelete.has(n.id))
            .map(n => n.data)
        
        // Re-layout the graph (this recalculates isLeaf and positions)
        if (remainingRawData.length > 0) {
            const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutElements(remainingRawData)
            nodes.value = layoutedNodes
            edges.value = layoutedEdges
        } else {
            nodes.value = []
            edges.value = []
        }
    }

     //Undos last action
    function undo() {
        const previousState = history.undo()
        if (previousState) {
            restoreSnapshot(previousState)
            return true
        }
        return false
    }

     //Redos last undone action
    function redo() {
        const nextState = history.redo()
        if (nextState) {
            restoreSnapshot(nextState)
            return true
        }
        return false
    }

    return {
        // States
        nodes,
        edges,
        canUndo,
        canRedo,
        
        // Basic setters
        setNodes,
        setEdges,
        
        // Setters with history
        setNodesWithHistory,
        setEdgesWithHistory,
        updateNode,
        updateNodePosition,
        
        // Actions
        removeNode,
        undo,
        redo,
        
        // History management
        recordState,
        initHistory,
        discardLastRecord: () => history.discardLast()
    }
})