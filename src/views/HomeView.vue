<script setup>
    import {useQuery} from '@tanstack/vue-query'
    import {VueFlow, useVueFlow} from '@vue-flow/core'
    import {Background} from '@vue-flow/background'
    import {Controls} from '@vue-flow/controls'
    import {watch, ref, onMounted, onUnmounted, computed} from 'vue'
    import CustomNode from '../components/CustomNode.vue'
    import CreateNodeModal from '../components/CreateNodeModal.vue'
    import {useFlowStore} from '../stores/flowStore'
    import {getLayoutElements} from '../utils/useLayout'
    import {useRouter} from 'vue-router'

    const store = useFlowStore()
    const {fitView, onNodeClick, onNodeDragStart, onNodeDragStop, getSelectedNodes} = useVueFlow()
    
    // Track position before drag starts
    let dragStartPositions = null

    const isModalOpen = ref(false)
    const router = useRouter()
    const flowContainer = ref(null)

    // Computed for undo/redo state
    const canUndo = computed(() => store.canUndo)
    const canRedo = computed(() => store.canRedo)

    const {data, isLoading, isError} = useQuery({
        queryKey: ['flowData'],
        queryFn: async () => {
            const response = await fetch('/payload.json')
            if(!response.ok) throw new Error('net response was not ok')
            return response.json()
        }
    })

    watch(data, (rawData)=> {
        if(rawData) {
            const {nodes, edges} = getLayoutElements(rawData)

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

    function handleCreateNode(formData) {
        // Record state before creating node
        store.recordState()
        
        const newId = Math.random().toString(36).substring(2, 6)

        const newRawNode = {
            id: newId,
            parentId: formData.parentId,
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

        const currentRawNodes = store.nodes.map(n=> ({
            id: n.id,
            parentId: n.data.parentId,
            type: n.data.type,
            name: n.data.name,
            data: n.data.data
        }))

        const allRawNodes = [...currentRawNodes, newRawNode]

        const {nodes, edges} = getLayoutElements(allRawNodes)

        store.setNodes(nodes)
        store.setEdges(edges)

        setTimeout(() => {
            fitView()
        }, 100)
    }

    const nodeTypes = {
        custom: CustomNode
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
    <div class="d-flex h-screen w-100">
        <div v-if="isLoading" class="d-flex w-100 h-100 align-center justify-center">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>

        <div v-else-if="isError" class="d-flex w-100 h-100 align-center justify-center text-error">
        Failed to load flow data.
        </div>

        <div v-else class="flex-grow-1 position-relative" style="height: 100vh;" ref="flowContainer">
            <!-- Toolbar -->
            <div class="toolbar position-absolute d-flex ga-2" style="top: 20px; right: 20px; z-index: 10;">
                <v-btn-group density="comfortable" variant="flat">
                    <v-btn
                        :disabled="!canUndo"
                        @click="handleUndo"
                        icon="mdi-undo"
                        title="Undo (Ctrl+Z)"
                    />
                    <v-btn
                        :disabled="!canRedo"
                        @click="handleRedo"
                        icon="mdi-redo"
                        title="Redo (Ctrl+Y)"
                    />
                </v-btn-group>
                
                <v-btn
                    color="primary"
                    prepend-icon="mdi-plus"
                    @click="isModalOpen = true"
                >
                    Create Node
                </v-btn>
            </div>

            <!-- Keyboard shortcuts help -->
            <v-chip
                class="position-absolute keyboard-help"
                style="bottom: 20px; left: 20px; z-index: 10;"
                size="small"
                variant="tonal"
            >
                <v-icon start size="small">mdi-keyboard</v-icon>
                Enter: Edit | Delete: Remove | Ctrl+Z/Y: Undo/Redo
            </v-chip>

            <VueFlow
                v-model:nodes="store.nodes"
                v-model:edges="store.edges"
                :node-types="nodeTypes"
                :default-viewport="{ zoom: 1 }"
                fit-view-on-init
                :select-nodes-on-drag="false"
                :nodes-focusable="true"
                :edges-focusable="false"
            >
                <Background pattern-color="#aaa" gap="8" />
                <Controls />
            </VueFlow>
        </div>

        <CreateNodeModal 
            v-model="isModalOpen" 
            @create="handleCreateNode" 
        />

        <router-view />
    </div>
</template>

<style>
.vue-flow__container {
    height: 100% !important;
    width: 100% !important;
}
.position-absolute { position: absolute !important; }
.position-relative { position: relative !important; }

.toolbar {
    display: flex;
    align-items: center;
}

.keyboard-help {
    opacity: 0.7;
    transition: opacity 0.2s;
}

.keyboard-help:hover {
    opacity: 1;
}

/* Focus styles for nodes */
.vue-flow__node:focus {
    outline: 2px solid #1867C0;
    outline-offset: 2px;
}

.vue-flow__node:focus-visible {
    outline: 2px solid #1867C0;
    outline-offset: 2px;
}
</style>
