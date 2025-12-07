<script setup>
    import { useQuery } from '@tanstack/vue-query'
    import { VueFlow, useVueFlow } from '@vue-flow/core'
    import { Background } from '@vue-flow/background'
    import { Controls } from '@vue-flow/controls'
    import { watch, ref, onMounted, onUnmounted, computed, markRaw } from 'vue'
    import CustomNode from '../components/CustomNode.vue'
    import CustomEdge from '../components/CustomEdge.vue'
    import CreateNodeModal from '../components/CreateNodeModal.vue'
    import { useFlowStore } from '../stores/flowStore'
    import { getLayoutElements, getLayerColor } from '../utils/useLayout'
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

    const { data, isLoading, isError } = useQuery({
        queryKey: ['flowData'],
        queryFn: async () => {
            const response = await fetch('/payload.json')
            if (!response.ok) throw new Error('net response was not ok')
            return response.json()
        }
    })

    watch(data, (rawData) => {
        if (rawData) {
            const { nodes, edges } = getLayoutElements(rawData)

            store.setNodes(nodes)
            store.setEdges(edges)
            
            // Initialize history after loading data
            store.initHistory()
        }
    })

    onNodeClick(({ node }) => {
        if (node.type === 'dateTimeConnector') return
        router.push(`/node/${node.id}`)
    })

    // Record state before node drag starts
    onNodeDragStart(({ nodes: draggedNodes }) => {
        // Record current state FIRST (before any position changes)
        store.recordState()
        // Then save starting positions to compare later
        dragStartPositions = draggedNodes.map(n => ({ 
            id: n.id, 
            x: n.position.x, 
            y: n.position.y 
        }))
    })

    // Check if position actually changed after drag
    onNodeDragStop(({ nodes: draggedNodes }) => {
        if (!dragStartPositions) return
        
        // Check if any dragged node actually moved
        let anyMoved = false
        for (const node of draggedNodes) {
            const startPos = dragStartPositions.find(p => p.id === node.id)
            if (startPos) {
                const dx = Math.abs(startPos.x - node.position.x)
                const dy = Math.abs(startPos.y - node.position.y)
                if (dx > 1 || dy > 1) { // Allow small tolerance
                    anyMoved = true
                    break
                }
            }
        }
        
        // If no actual movement, discard the recorded state
        if (!anyMoved) {
            store.discardLastRecord()
        }
        
        dragStartPositions = null
    })

    // Keyboard shortcuts handler
    function handleKeydown(event) {
        // Undo: Ctrl+Z (or Cmd+Z on Mac)
        if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
            event.preventDefault()
            handleUndo()
        }
        
        // Redo: Ctrl+Shift+Z or Ctrl+Y (or Cmd+Shift+Z / Cmd+Y on Mac)
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

    // Check if an input element is focused
    function isInputFocused() {
        const activeElement = document.activeElement
        return activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.isContentEditable
        )
    }

    function handleUndo() {
        store.undo()
    }

    function handleRedo() {
        store.redo()
    }

    // Handle add node from trailing line plus button
    function handleAddChildNode(event) {
        pendingParentId.value = event.parentId.toString()
        isModalOpen.value = true
    }

    // Handle add node from edge plus button
    function handleAddNodeOnEdge(event) {
        // For now, add as child of source node
        pendingParentId.value = event.sourceId
        isModalOpen.value = true
    }

    function handleCreateNode(formData) {
        // Record state before creating node
        store.recordState()
        
        const newId = Math.random().toString(36).substring(2, 6)
        
        // Use pending parent if set, otherwise use form's parentId
        const parentId = pendingParentId.value || formData.parentId

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
                ...(formData.type === 'businessHours' && {
                    timezone: formData.description 
                })
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

        // Reset pending parent
        pendingParentId.value = null

        setTimeout(() => {
            fitView()
        }, 100)
    }

    function handleModalClose() {
        pendingParentId.value = null
    }

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
        <div v-if="isLoading" class="loading-state">
            <v-progress-circular indeterminate color="primary" size="48" />
            <span class="loading-text">Loading workflow...</span>
        </div>

        <div v-else-if="isError" class="error-state">
            <v-icon icon="mdi-alert-circle" size="48" color="error" />
            <span>Failed to load flow data.</span>
        </div>

        <div v-else class="flow-wrapper" ref="flowContainer">
            <!-- Toolbar -->
            <div class="toolbar">
                <v-btn-group density="comfortable" variant="flat" class="toolbar-group">
                    <v-btn
                        :disabled="!canUndo"
                        @click="handleUndo"
                        icon="mdi-undo"
                        title="Undo (Ctrl+Z)"
                        size="small"
                    />
                    <v-btn
                        :disabled="!canRedo"
                        @click="handleRedo"
                        icon="mdi-redo"
                        title="Redo (Ctrl+Y)"
                        size="small"
                    />
                </v-btn-group>
            </div>

            <!-- Keyboard shortcuts help -->
            <div class="keyboard-help">
                <v-icon size="14" class="mr-1">mdi-keyboard</v-icon>
                Enter: Edit · Delete: Remove · Ctrl+Z/Y: Undo/Redo
            </div>

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

/* Loading & Error states */
.loading-state,
.error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    gap: 16px;
    color: #666;
}

.loading-text {
    font-size: 14px;
    color: #888;
}

/* Toolbar */
.toolbar {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 10;
    display: flex;
    gap: 12px;
    align-items: center;
}

.toolbar-group {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* Keyboard help */
.keyboard-help {
    position: absolute;
    bottom: 20px;
    left: 20px;
    z-index: 10;
    display: flex;
    align-items: center;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(8px);
    border-radius: 8px;
    font-size: 11px;
    color: #666;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    opacity: 0.7;
    transition: opacity 0.2s;
}

.keyboard-help:hover {
    opacity: 1;
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
