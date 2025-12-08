<script setup>
    import { VueFlow, useVueFlow } from '@vue-flow/core'
    import { Background } from '@vue-flow/background'
    import { Controls } from '@vue-flow/controls'
    import { ref, computed, markRaw } from 'vue'
    import { useRouter } from 'vue-router'
    
    import CustomNode from '../components/CustomNode.vue'
    import CustomEdge from '../components/CustomEdge.vue'
    import CreateNodeModal from '../components/CreateNodeModal.vue'
    import FlowToolbar from '../components/flow/FlowToolbar.vue'
    import KeyboardHelp from '../components/flow/KeyboardHelp.vue'
    import FlowStates from '../components/flow/FlowStates.vue'
    
    import { useFlowStore } from '../stores/flowStore'
    
    import { useFlowData } from '../composables/useFlowData'
    import { useKeyboardShortcuts } from '../composables/useKeyboardShortcuts'
    import { useNodeCreation } from '../composables/useNodeCreation'
    import { useNodeDrag } from '../composables/useNodeDrag'

    const store = useFlowStore()
    const router = useRouter()
    const { fitView, onNodeClick, onNodeDragStart, onNodeDragStop, getSelectedNodes } = useVueFlow()
    
    const flowContainer = ref(null)

    // the flow data
    const { isLoading, isError } = useFlowData(store)

    // the node creation modal
    const { 
        isModalOpen, 
        pendingParentId, 
        openModal, 
        closeModal, 
        handleCreateNode 
    } = useNodeCreation(store, fitView)

    // the drag start and stop events
    const { onDragStart, onDragStop } = useNodeDrag(store)

    // the keyboard shortcuts
    useKeyboardShortcuts({
        onUndo: () => store.undo(),
        onRedo: () => store.redo(),
        onOpenNode: (node) => {
            if (node.type !== 'dateTimeConnector') {
                router.push(`/node/${node.id}`)
            }
        },
        onDeleteNode: (node) => {
            if (confirm(`Delete node "${node.data?.name || node.id}"?`)) {
                store.removeNode(node.id)
            }
        },
        onEscape: () => {
            if (router.currentRoute.value.name === 'node-details') {
                router.push('/')
            }
        },
        getSelectedNodes: () => getSelectedNodes.value
    })

    // the computed properties

    const canUndo = computed(() => store.canUndo)
    const canRedo = computed(() => store.canRedo)

    // the event handlers

    // the node click event
    onNodeClick(({ node }) => {
        if (node.type === 'dateTimeConnector') return
        router.push(`/node/${node.id}`)
    })

    // the drag start and stop events
    onNodeDragStart(onDragStart)
    onNodeDragStop(onDragStop)

    // the add child node event
    function handleAddChildNode(event) {
        openModal(event.parentId)
    }

    // the add node on edge event
    function handleAddNodeOnEdge(event) {
        openModal(event.sourceId)
    }

    // the vue flow config
    // using markRaw to prevent reactivity issues
    
    const nodeTypes = {
        custom: markRaw(CustomNode)
    }

    const edgeTypes = {
        default: markRaw(CustomEdge),
        smoothstep: markRaw(CustomEdge)
    }
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
                @undo="store.undo()"
                @redo="store.redo()"
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
            @update:model-value="val => !val && closeModal()"
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

/* Hide default edge paths since we're using custom edges */
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
