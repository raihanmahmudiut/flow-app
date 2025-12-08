<script setup>
    import { useQuery } from '@tanstack/vue-query'
    import { VueFlow, useVueFlow } from '@vue-flow/core'
    import { Background } from '@vue-flow/background'
    import { Controls } from '@vue-flow/controls'
    import { watch, ref, onMounted, onUnmounted, computed, markRaw } from 'vue'
    import CustomNode from '../components/CustomNode.vue'
    import CustomEdge from '../components/CustomEdge.vue'
    import CreateNodeModal from '../components/CreateNodeModal.vue'
    import FlowToolbar from '../components/flow/FlowToolbar.vue'
    import KeyboardHelp from '../components/flow/KeyboardHelp.vue'
    import FlowStates from '../components/flow/FlowStates.vue'
    import { useFlowStore } from '../stores/flowStore'
    import { getLayoutElements } from '../utils/useLayout'
    import { useRouter } from 'vue-router'

    const store = useFlowStore()
    const { fitView, onNodeClick, onNodeDragStart, onNodeDragStop, getSelectedNodes } = useVueFlow()
    
    // Track position before drag starts
    let dragStartPositions = null

    const isModalOpen = ref(false)
    const pendingParentId = ref(null)
    const router = useRouter()
    const flowContainer = ref(null)

    // Computed for undo/redo state
    const canUndo = computed(() => store.canUndo)
    const canRedo = computed(() => store.canRedo)

    // Fetch flow data
    const { data, isLoading, isError } = useQuery({
        queryKey: ['flowData'],
        queryFn: async () => {
            const response = await fetch('/payload.json')
            if (!response.ok) throw new Error('net response was not ok')
            return response.json()
        }
    })

    // Initialize flow when data loads
    watch(data, (rawData) => {
        if (rawData) {
            const { nodes, edges } = getLayoutElements(rawData)
            store.setNodes(nodes)
            store.setEdges(edges)
            store.initHistory()
        }
    })

    // Handle node click - navigate to node details
    onNodeClick(({ node }) => {
        if (node.type === 'dateTimeConnector') return
        router.push(`/node/${node.id}`)
    })

    // Record state before node drag starts
    onNodeDragStart(({ nodes: draggedNodes }) => {
        store.recordState()
        dragStartPositions = draggedNodes.map(n => ({ 
            id: n.id, 
            x: n.position.x, 
            y: n.position.y 
        }))
    })

    // Check if position actually changed after drag
    onNodeDragStop(({ nodes: draggedNodes }) => {
        if (!dragStartPositions) return
        
        let anyMoved = false
        for (const node of draggedNodes) {
            const startPos = dragStartPositions.find(p => p.id === node.id)
            if (startPos) {
                const dx = Math.abs(startPos.x - node.position.x)
                const dy = Math.abs(startPos.y - node.position.y)
                if (dx > 1 || dy > 1) {
                    anyMoved = true
                    break
                }
            }
        }
        
        if (!anyMoved) {
            store.discardLastRecord()
        }
        
        dragStartPositions = null
    })

    // ==================== Keyboard Shortcuts ====================
    
    function handleKeydown(event) {
        // Undo: Ctrl+Z (or Cmd+Z on Mac)
        if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
            event.preventDefault()
            handleUndo()
        }
        
        // Redo: Ctrl+Shift+Z or Ctrl+Y
        if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
            event.preventDefault()
            handleRedo()
        }

        // Enter/Space: Open drawer for selected node
        if (event.key === 'Enter' || event.key === ' ') {
            const selectedNodes = getSelectedNodes.value
            if (selectedNodes.length === 1) {
                const node = selectedNodes[0]
                if (node.type !== 'dateTimeConnector') {
                    event.preventDefault()
                    router.push(`/node/${node.id}`)
                }
            }
        }

        // Delete/Backspace: Delete selected node
        if (event.key === 'Delete' || event.key === 'Backspace') {
            const selectedNodes = getSelectedNodes.value
            if (selectedNodes.length === 1 && !isInputFocused()) {
                event.preventDefault()
                const node = selectedNodes[0]
                if (confirm(`Delete node "${node.data?.name || node.id}"?`)) {
                    store.removeNode(node.id)
                }
            }
        }

        // Escape: Close drawer
        if (event.key === 'Escape') {
            if (router.currentRoute.value.name === 'node-details') {
                router.push('/')
            }
        }
    }

    function isInputFocused() {
        const activeElement = document.activeElement
        return activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.isContentEditable
        )
    }

    // ==================== Undo/Redo Handlers ====================

    function handleUndo() {
        store.undo()
    }

    function handleRedo() {
        store.redo()
    }

    // ==================== Node Creation Handlers ====================

    function handleAddChildNode(event) {
        pendingParentId.value = event.parentId.toString()
        isModalOpen.value = true
    }

    function handleAddNodeOnEdge(event) {
        pendingParentId.value = event.sourceId
        isModalOpen.value = true
    }

    function handleCreateNode(formData) {
        store.recordState()
        
        const newId = Math.random().toString(36).substring(2, 6)
        const parentId = pendingParentId.value || formData.parentId

        // Handle Business Hours (dateTime) type - creates 3 nodes
        if (formData.type === 'dateTime') {
            createDateTimeNodes(newId, parentId, formData)
            return
        }

        // Regular node creation
        createRegularNode(newId, parentId, formData)
    }

    function createDateTimeNodes(newId, parentId, formData) {
        const successId = Math.random().toString(36).substring(2, 8)
        const failureId = Math.random().toString(36).substring(2, 8)
        
        const dateTimeNode = {
            id: newId,
            parentId: parentId,
            type: 'dateTime',
            name: formData.title || 'Business Hours',
            data: {
                times: [
                    { startTime: '09:00', endTime: '17:00', day: 'mon' },
                    { startTime: '09:00', endTime: '17:00', day: 'tue' },
                    { startTime: '09:00', endTime: '17:00', day: 'wed' },
                    { startTime: '09:00', endTime: '17:00', day: 'thu' },
                    { startTime: '09:00', endTime: '17:00', day: 'fri' },
                ],
                connectors: [successId, failureId],
                timezone: 'UTC',
                action: 'businessHours'
            }
        }
        
        const successNode = {
            id: successId,
            parentId: newId,
            type: 'dateTimeConnector',
            name: 'Success',
            data: { connectorType: 'success' }
        }
        
        const failureNode = {
            id: failureId,
            parentId: newId,
            type: 'dateTimeConnector',
            name: 'Failure',
            data: { connectorType: 'failure' }
        }
        
        const currentRawData = store.nodes.map(n => n.data)
        const newRawData = [...currentRawData, dateTimeNode, successNode, failureNode]
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutElements(newRawData)
        
        store.setNodes(layoutedNodes)
        store.setEdges(layoutedEdges)
        
        pendingParentId.value = null
    }

    function createRegularNode(newId, parentId, formData) {
        const newRawNode = {
            id: newId,
            parentId: parentId,
            type: formData.type,
            name: formData.title,
            data: {
                ...(formData.type === 'sendMessage' && {
                    payload: [{ type: 'text', text: formData.description }]
                }),
                ...(formData.type === 'addComment' && {
                    comment: formData.description
                }),
            }
        }

        const currentRawNodes = store.nodes.map(n => ({
            id: n.id,
            parentId: n.data.parentId,
            type: n.data.type,
            name: n.data.name,
            data: n.data.data
        }))

        const allRawNodes = [...currentRawNodes, newRawNode]
        const { nodes, edges } = getLayoutElements(allRawNodes)

        store.setNodes(nodes)
        store.setEdges(edges)

        pendingParentId.value = null

        setTimeout(() => {
            fitView()
        }, 100)
    }

    function handleModalClose() {
        pendingParentId.value = null
    }

    // ==================== Vue Flow Config ====================

    const nodeTypes = {
        custom: markRaw(CustomNode)
    }

    const edgeTypes = {
        default: markRaw(CustomEdge),
        smoothstep: markRaw(CustomEdge)
    }

    // Register keyboard shortcuts
    onMounted(() => {
        window.addEventListener('keydown', handleKeydown)
    })

    onUnmounted(() => {
        window.removeEventListener('keydown', handleKeydown)
    })
</script>

<template>
    <div class="flow-container">
        <!-- Loading/Error States -->
        <FlowStates 
            :is-loading="isLoading" 
            :is-error="isError" 
        />

        <!-- Main Flow View -->
        <div v-if="!isLoading && !isError" class="flow-wrapper" ref="flowContainer">
            <FlowToolbar 
                :can-undo="canUndo" 
                :can-redo="canRedo"
                @undo="handleUndo"
                @redo="handleRedo"
            />

            <KeyboardHelp />

            <VueFlow
                v-model:nodes="store.nodes"
                v-model:edges="store.edges"
                :node-types="nodeTypes"
                :edge-types="edgeTypes"
                :default-viewport="{ zoom: 0.9 }"
                fit-view-on-init
                :select-nodes-on-drag="false"
                :nodes-focusable="true"
                :edges-focusable="false"
                @node-click="({ node }) => {}"
            >
                <template #node-custom="nodeProps">
                    <CustomNode 
                        v-bind="nodeProps" 
                        @add-child-node="handleAddChildNode"
                    />
                </template>
                
                <template #edge-smoothstep="edgeProps">
                    <CustomEdge 
                        v-bind="edgeProps"
                        @add-node="handleAddNodeOnEdge"
                    />
                </template>

                <Background :gap="20" :size="1" pattern-color="rgba(0,0,0,0.03)" />
                <Controls position="bottom-right" class="flow-controls" />
            </VueFlow>
        </div>

        <CreateNodeModal 
            v-model="isModalOpen" 
            @create="handleCreateNode"
            @update:model-value="val => !val && handleModalClose()"
            :preset-parent-id="pendingParentId"
        />

        <router-view />
    </div>
</template>

<style>
/* Flow container */
.flow-container {
    display: flex;
    width: 100%;
    height: 100vh;
    background: #fafafa;
    position: relative;
}

.flow-wrapper {
    flex: 1;
    height: 100%;
    position: relative;
    background: 
        radial-gradient(circle at 50% 50%, rgba(233, 30, 99, 0.02) 0%, transparent 70%),
        linear-gradient(to bottom, #fafafa, #f5f5f5);
}

/* Vue Flow overrides */
.vue-flow {
    background: transparent !important;
}

.vue-flow__container {
    height: 100% !important;
    width: 100% !important;
}

/* Hide default edge paths since we use custom */
.vue-flow__edge-path {
    fill: none;
}

/* Controls styling */
.flow-controls {
    background: white !important;
    border-radius: 8px !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
    border: none !important;
}

.vue-flow__controls-button {
    background: white !important;
    border: none !important;
    border-bottom: 1px solid #eee !important;
}

.vue-flow__controls-button:last-child {
    border-bottom: none !important;
}

.vue-flow__controls-button:hover {
    background: #f5f5f5 !important;
}

/* Node focus styles */
.vue-flow__node:focus {
    outline: none;
}

.vue-flow__node:focus-visible {
    outline: none;
}

.vue-flow__node.selected {
    z-index: 10;
}

/* Background pattern */
.vue-flow__background {
    background-color: transparent !important;
}
</style>
