<script setup>
    import {useQuery} from '@tanstack/vue-query'
    import {VueFlow, useVueFlow} from '@vue-flow/core'
    import {Background} from '@vue-flow/background'
    import {Controls} from '@vue-flow/controls'
    import {watch, ref} from 'vue'
    import CustomNode from '../components/CustomNode.vue'
    import CreateNodeModal from '../components/CreateNodeModal.vue'
    import {useFlowStore} from '../stores/flowStore'
    import {getLayoutElements} from '../utils/useLayout'
    import {useRouter} from 'vue-router'

    const store = useFlowStore()
    const {fitView, onNodeClick} = useVueFlow()

    const isModalOpen = ref(false)
    const router = useRouter()

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
        }
    })

    onNodeClick(({ node }) => {
        if (node.type === 'dateTimeConnector') return;
        router.push(`/node/${node.id}`)
    })

    function handleCreateNode(formData) {
        const newId = Math.random().toString(36).substring(2, 6)

        const newRawNode = {
            id: newId,
            parentId: formData.parentId,
            type: formData.type,
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
</script>

<template>
    <div class="d-flex h-screen w-100">
        <div v-if="isLoading" class="d-flex w-100 h-100 align-center justify-center">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>

        <div v-else-if="isError" class="d-flex w-100 h-100 align-center justify-center text-error">
        Failed to load flow data.
        </div>

        <div v-else class="flex-grow-1" style="height: 100vh;">
            <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            class="position-absolute"
            style="top: 20px; right: 20px; z-index: 10;"
            @click="isModalOpen = true"
            >
                Create Node
            </v-btn>
            <VueFlow
                v-model:nodes="store.nodes"
                v-model:edges="store.edges"
                :node-types="nodeTypes"
                :default-viewport="{ zoom: 1 }"
                fit-view-on-init
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

</style>
