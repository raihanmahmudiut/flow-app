import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/**
 * Node type configuration mapping
 * Maps node types to their visual properties
 */
const NODE_TYPE_CONFIG = {
    trigger: { 
        icon: 'mdi-flash', 
        color: '#9333ea', 
        bgColor: '#f3e8ff', 
        label: 'Trigger' 
    },
    dateTime: { 
        icon: 'mdi-clock-outline', 
        color: '#ff6b4a', 
        bgColor: '#fff4f2', 
        label: 'Business Hours' 
    },
    sendMessage: { 
        icon: 'mdi-message-text-outline', 
        color: '#42a5f5', 
        bgColor: '#e3f2fd', 
        label: 'Send Message' 
    },
    addComment: { 
        icon: 'mdi-comment-text-outline', 
        color: '#ffb300', 
        bgColor: '#fff8e1', 
        label: 'Add Comment' 
    },
    default: { 
        icon: 'mdi-circle-outline', 
        color: '#666', 
        bgColor: '#f5f5f5', 
        label: 'Node' 
    }
}

// Handles editing node properties in a drawer/panel
export function useNodeEditor(store) {
    const route = useRoute()
    const router = useRouter()
    
    const editableName = ref('')
    const editableMessage = ref('')
    const editableComment = ref('')
    const editableTimes = ref([])
    const editableTimezone = ref('UTC')

    // Computed properties Section

    
     //Gets the currently active node based on route params
    const activeNode = computed(() => {
        return store.nodes.find(n => n.id === route.params.id)
    })

    //Gets the node's top-level data
    const nodeData = computed(() => {
        return activeNode.value ? activeNode.value.data : {}
    })

    //Gets the node's internal data (nested under data.data)
    const nodeInternalData = computed(() => {
        return activeNode.value ? activeNode.value.data.data : {}
    })

    //Gets visual configuration for the node type
    const nodeTypeInfo = computed(() => {
        const type = nodeData.value?.type
        return NODE_TYPE_CONFIG[type] || NODE_TYPE_CONFIG.default
    })

    //Gets message attachments for sendMessage nodes
    const messageAttachments = computed(() => {
        if (!nodeInternalData.value?.payload) return []
        return nodeInternalData.value.payload.filter(p => p.type === 'attachment')
    })

    // Watchers Section

    //Syncs local state when active node changes
    watch(activeNode, (node) => {
        if (node) {
            populateLocalState(node)
        }
    }, { immediate: true })

    // Methods Section

    //Populates local editable state from node data
    function populateLocalState(node) {
        editableName.value = node.data.name || ''
        editableComment.value = node.data.data?.comment || ''
        editableTimezone.value = node.data.data?.timezone || 'UTC'
        editableTimes.value = JSON.parse(JSON.stringify(node.data.data?.times || []))
        
        // Gets the text payload for sendMessage
        const textPayload = node.data.data?.payload?.find(p => p.type === 'text')
        editableMessage.value = textPayload?.text || ''
    }

    //Saves current editable state to the store
    function saveChanges() {
        if (!activeNode.value) return

        const nodeId = activeNode.value.id
        const nodeType = nodeData.value.type

        // Builds updates based on node type
        const updates = {
            name: editableName.value
        }

        if (nodeType === 'sendMessage') {
            const currentPayload = nodeInternalData.value.payload || []
            const newPayload = currentPayload.map(item => {
                if (item.type === 'text') {
                    return { ...item, text: editableMessage.value }
                }
                return item
            })
            updates.data = { ...nodeInternalData.value, payload: newPayload }
        } else if (nodeType === 'addComment') {
            updates.data = { ...nodeInternalData.value, comment: editableComment.value }
        } else if (nodeType === 'dateTime') {
            updates.data = {
                ...nodeInternalData.value,
                times: editableTimes.value,
                timezone: editableTimezone.value
            }
        }

        store.updateNode(nodeId, updates)
    }

    function closeDrawer() {
        router.push('/')
    }

    //Deletes the active node with confirmation
    function deleteNode() {
        if (!activeNode.value) return
        
        if (confirm('Are you sure you want to delete this node?')) {
            store.removeNode(activeNode.value.id)
            closeDrawer()
        }
    }

    return {
        // Computed
        activeNode,
        nodeData,
        nodeInternalData,
        nodeTypeInfo,
        messageAttachments,

        // Editable State
        editableName,
        editableMessage,
        editableComment,
        editableTimes,
        editableTimezone,

        // Methods
        saveChanges,
        closeDrawer,
        deleteNode,
        populateLocalState
    }
}

