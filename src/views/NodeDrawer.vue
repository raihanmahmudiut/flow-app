<script setup>
    import { computed, ref, watch } from 'vue'
    import { useRoute, useRouter } from 'vue-router'
    import { useFlowStore } from '../stores/flowStore'
    
    const route = useRoute()
    const router = useRouter()
    const store = useFlowStore()
    
    const editableName = ref('')
    const editableMessage = ref('')
    const editableComment = ref('')
    const editableTimes = ref([])
    const editableTimezone = ref('UTC')
    
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

    const messageText = computed(() => {
        if (!nodeInternalData.value?.payload) return ''
        const textObj = nodeInternalData.value.payload.find(p => p.type === 'text')
        return textObj ? textObj.text : ''
    })
    
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    
    // this will watch for node changes and populate local state
    watch(activeNode, (node) => {
        if (node) {
            editableName.value = node.data.name || ''
            editableComment.value = node.data.data?.comment || ''
            editableTimezone.value = node.data.data?.timezone || 'UTC'
            editableTimes.value = JSON.parse(JSON.stringify(node.data.data?.times || []))
            
            // this will get the text payload for sendMessage
            const textPayload = node.data.data?.payload?.find(p => p.type === 'text')
            editableMessage.value = textPayload?.text || ''
        }
    }, { immediate: true })
    
    function saveChanges() {
        if (!activeNode.value) return
        
        const nodeId = activeNode.value.id
        const nodeType = nodeData.value.type
        
        // this will build updates based on node type
        const updates = {
            name: editableName.value
        }
        
        if (nodeType === 'sendMessage') {
            // this will update the text in payload
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
        <div class="drawer-header">
            <div class="header-icon" :style="{ background: nodeTypeInfo.bgColor }">
                <v-icon :icon="nodeTypeInfo.icon" :color="nodeTypeInfo.color" size="24" />
            </div>
            <div class="header-content">
                <h2 class="header-title">{{ nodeData.name || nodeTypeInfo.label }}</h2>
                <p class="header-subtitle">{{ nodeTypeInfo.label }}</p>
            </div>
            <v-btn 
                icon="mdi-close" 
                variant="text" 
                size="small"
                @click="closeDrawer"
                class="close-btn"
            />
        </div>

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
                <p class="section-description">
                    Allows a branch to be created based on date & time conditions. Use it to set business hours or date range conditions.
                </p>

                <div class="toggle-tabs">
                    <button class="toggle-tab active">
                        <v-icon size="16" class="mr-1">mdi-calendar</v-icon>
                        Day
                    </button>
                    <button class="toggle-tab">
                        <v-icon size="16" class="mr-1">mdi-clock-outline</v-icon>
                        Time
                    </button>
                </div>

                <div class="time-grid">
                    <div 
                        v-for="(time, index) in editableTimes" 
                        :key="index" 
                        class="time-row"
                    >
                        <span class="day-label">{{ daysOfWeek[index] || time.day }}</span>
                        <div class="time-inputs">
                            <div class="time-input-wrapper">
                                <input 
                                    type="time" 
                                    v-model="time.startTime" 
                                    class="time-input"
                                    @change="saveChanges"
                                />
                                <v-icon size="14" class="time-icon">mdi-clock-outline</v-icon>
                            </div>
                            <span class="time-separator">to</span>
                            <div class="time-input-wrapper">
                                <input 
                                    type="time" 
                                    v-model="time.endTime" 
                                    class="time-input"
                                    @change="saveChanges"
                                />
                                <v-icon size="14" class="time-icon">mdi-clock-outline</v-icon>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="timezone-section">
                    <label class="field-label">Time Zone</label>
                    <v-select
                        v-model="editableTimezone"
                        :items="['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London']"
                        variant="outlined"
                        density="compact"
                        hide-details
                        class="timezone-select"
                        @update:model-value="saveChanges"
                    />
                </div>
            </div>

            <!-- Send Message Section -->
            <div v-if="nodeData.type === 'sendMessage'" class="section">
                <label class="field-label">Message:</label>
                <div class="message-preview">
                    {{ messageText || 'No message content' }}
                </div>

                <v-textarea
                    @blur="saveChanges"
                    v-model="editableMessage"
                    label="Edit Message"
                    variant="outlined"
                    rows="4"
                    auto-grow
                    class="mt-4"
                    hide-details
                />

                <label class="field-label mt-4">Attachments</label>
                <div v-for="(item, i) in nodeInternalData.payload" :key="i">
                    <div v-if="item.type === 'attachment'" class="attachment-card">
                        <v-img :src="item.attachment" height="120" cover class="attachment-image" />
                        <div class="attachment-name">
                            {{ item.attachment.split('/').pop() }}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Add Comment Section -->
            <div v-if="nodeData.type === 'addComment'" class="section">
                <label class="field-label">Internal Comment</label>
                <v-textarea
                    v-model="editableComment"
                    @blur="saveChanges"
                    label="Comment"
                    variant="outlined"
                    rows="3"
                    hide-details
                />
            </div>

            <!-- Trigger Section -->
            <div v-if="nodeData.type === 'trigger'" class="section">
                <label class="field-label">Trigger Type</label>
                <div class="info-card">
                    <v-icon size="20" class="mr-2" color="primary">mdi-flash</v-icon>
                    {{ nodeInternalData.type === 'conversationOpened' ? 'Conversation Opened' : nodeInternalData.type }}
                </div>
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

.drawer-header {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 20px;
}

.header-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.header-content {
    flex: 1;
    min-width: 0;
}

.header-title {
    font-size: 18px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0;
    line-height: 1.3;
}

.header-subtitle {
    font-size: 13px;
    color: #888;
    margin: 4px 0 0 0;
}

.close-btn {
    margin: -8px -8px 0 0;
}

.drawer-content {
    padding: 20px;
    overflow-y: auto;
    flex: 1;
}

.section {
    margin-bottom: 24px;
}

.section-description {
    font-size: 13px;
    color: #666;
    line-height: 1.5;
    margin-bottom: 20px;
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

/* Toggle tabs */
.toggle-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
}

.toggle-tab {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: #fff;
    font-size: 13px;
    color: #666;
    cursor: pointer;
    transition: all 0.2s;
}

.toggle-tab.active {
    background: #f5f5f5;
    border-color: #ccc;
    color: #333;
}

.toggle-tab:hover {
    border-color: #bbb;
}

/* Time grid */
.time-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 24px;
}

.time-row {
    display: flex;
    align-items: center;
    gap: 16px;
}

.day-label {
    width: 40px;
    font-size: 13px;
    font-weight: 500;
    color: #333;
}

.time-inputs {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
}

.time-input-wrapper {
    position: relative;
    flex: 1;
}

.time-input {
    width: 100%;
    padding: 10px 12px;
    padding-right: 32px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    font-size: 13px;
    color: #333;
    background: #fff;
    transition: border-color 0.2s;
}

.time-input:focus {
    outline: none;
    border-color: #ff6b4a;
}

.time-icon {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: #999;
    pointer-events: none;
}

.time-separator {
    font-size: 13px;
    color: #888;
}

/* Timezone */
.timezone-section {
    margin-top: 24px;
}

.timezone-select {
    font-size: 13px;
}

/* Message preview */
.message-preview {
    padding: 16px;
    background: #f8f9fa;
    border-radius: 12px;
    font-size: 14px;
    color: #333;
    line-height: 1.5;
    white-space: pre-wrap;
}

/* Attachment card */
.attachment-card {
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #e0e0e0;
    margin-top: 8px;
}

.attachment-image {
    border-radius: 0;
}

.attachment-name {
    padding: 10px 12px;
    font-size: 12px;
    color: #666;
    background: #fafafa;
}

/* Info card */
.info-card {
    display: flex;
    align-items: center;
    padding: 14px 16px;
    background: #f8f9fa;
    border-radius: 10px;
    font-size: 14px;
    color: #333;
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
