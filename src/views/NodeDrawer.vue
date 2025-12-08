<script setup>
    import { useFlowStore } from '../stores/flowStore'
    
    // Presentational components
    import DrawerHeader from '../components/drawer/DrawerHeader.vue'
    import DateTimeEditor from '../components/drawer/DateTimeEditor.vue'
    import MessageEditor from '../components/drawer/MessageEditor.vue'
    import CommentEditor from '../components/drawer/CommentEditor.vue'
    import TriggerInfo from '../components/drawer/TriggerInfo.vue'
    
    // Composables
    import { useNodeEditor } from '../composables/useNodeEditor'
    
    const store = useFlowStore()

    // Uses the node editor composable for all editing logic
    const {
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
        deleteNode
    } = useNodeEditor(store)
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
