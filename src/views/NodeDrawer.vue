<script setup>
    import { computed, ref, watch } from 'vue'
    import { useRoute, useRouter } from 'vue-router'
    import { useFlowStore } from '../stores/flowStore'
    
    // Import presentational components
    import DrawerHeader from '../components/drawer/DrawerHeader.vue'
    import DateTimeEditor from '../components/drawer/DateTimeEditor.vue'
    import MessageEditor from '../components/drawer/MessageEditor.vue'
    import CommentEditor from '../components/drawer/CommentEditor.vue'
    import TriggerInfo from '../components/drawer/TriggerInfo.vue'
    
    const route = useRoute()
    const router = useRouter()
    const store = useFlowStore()
    
    // Local editable state
    const editableName = ref('')
    const editableMessage = ref('')
    const editableComment = ref('')
    const editableTimes = ref([])
    const editableTimezone = ref('UTC')
    
    // Computed properties for node data
    const activeNode = computed(() => {
        return store.nodes.find(n => n.id === route.params.id)
    })
    
    const nodeData = computed(() => activeNode.value ? activeNode.value.data : {})
    const nodeInternalData = computed(() => activeNode.value ? activeNode.value.data.data : {})

    const nodeTypeInfo = computed(() => {
        const type = nodeData.value?.type
        switch (type) {
            case 'trigger':
                return { icon: 'mdi-flash', color: '#9333ea', bgColor: '#f3e8ff', label: 'Trigger' }
            case 'dateTime':
                return { icon: 'mdi-clock-outline', color: '#ff6b4a', bgColor: '#fff4f2', label: 'Business Hours' }
            case 'sendMessage':
                return { icon: 'mdi-message-text-outline', color: '#42a5f5', bgColor: '#e3f2fd', label: 'Send Message' }
            case 'addComment':
                return { icon: 'mdi-comment-text-outline', color: '#ffb300', bgColor: '#fff8e1', label: 'Add Comment' }
            default:
                return { icon: 'mdi-circle-outline', color: '#666', bgColor: '#f5f5f5', label: 'Node' }
        }
    })

    // Computed for message attachments
    const messageAttachments = computed(() => {
        if (!nodeInternalData.value?.payload) return []
        return nodeInternalData.value.payload.filter(p => p.type === 'attachment')
    })
    
    // Watch for node changes and populate local state
    watch(activeNode, (node) => {
        if (node) {
            editableName.value = node.data.name || ''
            editableComment.value = node.data.data?.comment || ''
            editableTimezone.value = node.data.data?.timezone || 'UTC'
            editableTimes.value = JSON.parse(JSON.stringify(node.data.data?.times || []))
            
            // Get the text payload for sendMessage
            const textPayload = node.data.data?.payload?.find(p => p.type === 'text')
            editableMessage.value = textPayload?.text || ''
        }
    }, { immediate: true })
    
    /**
     * Save changes to the store
     */
    function saveChanges() {
        if (!activeNode.value) return
        
        const nodeId = activeNode.value.id
        const nodeType = nodeData.value.type
        
        // Build updates based on node type
        const updates = {
            name: editableName.value
        }
        
        if (nodeType === 'sendMessage') {
            // Update the text in payload
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
    
    function deleteNode() {
        if (confirm('Are you sure you want to delete this node?')) {
            store.removeNode(activeNode.value.id)
            closeDrawer()
        }
    }
</script>
    
<template>
    <v-navigation-drawer
        location="right"
        width="420"
        permanent
        class="node-drawer"
        elevation="0"
    >
        <!-- Header -->
        <DrawerHeader
            :icon="nodeTypeInfo.icon"
            :icon-color="nodeTypeInfo.color"
            :bg-color="nodeTypeInfo.bgColor"
            :title="nodeData.name || nodeTypeInfo.label"
            :subtitle="nodeTypeInfo.label"
            @close="closeDrawer"
        />

        <v-divider />

        <div v-if="activeNode" class="drawer-content">
            <!-- Editable Name Field -->
            <div class="section">
                <label class="field-label">Node Name</label>
                <v-text-field
                    v-model="editableName"
                    variant="outlined"
                    density="compact"
                    hide-details
                    placeholder="Enter node name"
                    @blur="saveChanges"
                />
            </div>
            
            <!-- Business Hours / DateTime Section -->
            <div v-if="nodeData.type === 'dateTime'" class="section">
                <DateTimeEditor
                    v-model:times="editableTimes"
                    v-model:timezone="editableTimezone"
                    @save="saveChanges"
                />
            </div>

            <!-- Send Message Section -->
            <div v-if="nodeData.type === 'sendMessage'" class="section">
                <MessageEditor
                    v-model:message="editableMessage"
                    :attachments="messageAttachments"
                    @save="saveChanges"
                />
            </div>

            <!-- Add Comment Section -->
            <div v-if="nodeData.type === 'addComment'" class="section">
                <CommentEditor
                    v-model:comment="editableComment"
                    @save="saveChanges"
                />
            </div>

            <!-- Trigger Section -->
            <div v-if="nodeData.type === 'trigger'" class="section">
                <TriggerInfo :trigger-type="nodeInternalData.type" />
            </div>
        </div>

        <div v-else class="empty-state">
            <v-icon size="48" color="grey-lighten-1">mdi-file-document-outline</v-icon>
            <p>Node not found</p>
        </div>

        <!-- Footer Actions -->
        <div v-if="activeNode" class="drawer-footer">
            <v-btn 
                color="error" 
                variant="text" 
                prepend-icon="mdi-delete"
                @click="deleteNode"
            >
                Delete Node
            </v-btn>
        </div>
    </v-navigation-drawer>
</template>
    
<style scoped>
.node-drawer {
    background: #fff;
    border-left: 1px solid #eee;
}

.drawer-content {
    padding: 20px;
    overflow-y: auto;
    flex: 1;
}

.section {
    margin-bottom: 24px;
}

.field-label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: #888;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

/* Empty state */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: #aaa;
    gap: 12px;
}

/* Footer */
.drawer-footer {
    padding: 16px 20px;
    border-top: 1px solid #eee;
}
</style>
