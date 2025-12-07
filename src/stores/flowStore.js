import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useFlowStore = defineStore('flow', () => {
    const nodes = ref([])
    const edges = ref([])

    function setNodes(newNodes) {
        nodes.value = newNodes
    }
    
    function setEdges(newEdges) {
        edges.value = newEdges
    }

    function removeNode(id) {
        nodes.value = nodes.value.filter(n => n.id !== id)
        edges.value = edges.value.filter(e => e.source !== id && e.target !== id)
    }


    return {nodes, edges, setEdges, setNodes, removeNode}
})