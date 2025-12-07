<script setup>
import { Handle, Position } from '@vue-flow/core'
import { computed } from 'vue'

const props = defineProps(['data', 'selected'])

const emit = defineEmits(['add-child-node'])

const isConnector = computed(() => props.data.type === 'dateTimeConnector')
const isLeaf = computed(() => props.data.isLeaf)
const layerColor = computed(() => props.data.layerColor || '#ff5722')

const nodeConfig = computed(() => {
    const type = props.data.type
    const connectorType = props.data.data?.connectorType
    const color = layerColor.value
    
    switch (type) {
        case 'trigger':
            return {
                icon: 'mdi-flash',
                bgColor: '#fff',
                borderColor: '#e0e0e0',
                iconBg: color,
                iconColor: '#fff'
            }
        case 'dateTime':
            return {
                icon: 'mdi-clock-outline',
                bgColor: '#fff4f2',
                borderColor: color,
                iconBg: color,
                iconColor: '#fff'
            }
        case 'dateTimeConnector':
            return {
                // No icon for connectors
                bgColor: connectorType === 'success' ? '#e8f5e9' : '#ffebee',
                borderColor: connectorType === 'success' ? '#4caf50' : '#f44336',
                textColor: connectorType === 'success' ? '#2e7d32' : '#c62828'
            }
        case 'sendMessage':
            return {
                icon: 'mdi-message-text-outline',
                bgColor: '#e3f2fd',
                borderColor: color,
                iconBg: color,
                iconColor: '#fff'
            }
        case 'addComment':
            return {
                icon: 'mdi-comment-text-outline',
                bgColor: '#fff8e1',
                borderColor: color,
                iconBg: color,
                iconColor: '#fff'
            }
        default:
            return {
                icon: 'mdi-circle-outline',
                bgColor: '#fff',
                borderColor: '#e0e0e0',
                iconBg: '#f5f5f5',
                iconColor: '#666'
            }
    }
})

const nodeTitle = computed(() => {
    if (props.data.name) return props.data.name
    switch (props.data.type) {
        case 'trigger': return 'Trigger'
        case 'sendMessage': return 'Send Message'
        case 'addComment': return 'Add Comment'
        case 'dateTime': return 'Business Hours'
        case 'dateTimeConnector': 
            return props.data.data?.connectorType === 'success' ? 'Success' : 'Failure'
        default: return 'Unknown Node'
    }
})

const nodeDescription = computed(() => {
    const d = props.data.data
    if (!d) return ''

    let text = ''

    if (props.data.type === 'trigger') {
        text = d.type === 'conversationOpened' ? 'Conversation Opened' : d.type || ''
    } else if (props.data.type === 'sendMessage' && d.payload) {
        const textObj = d.payload.find(p => p.type === 'text')
        text = textObj ? textObj.text : 'Attachment Only'
    } else if (props.data.type === 'addComment') {
        text = d.comment || ''
    } else if (props.data.type === 'dateTime') {
        text = `Business Hours - ${d.timezone || 'UTC'}`
    }

    // Truncate and clean up
    text = text.replace(/\n/g, ' ')
    return text.length > 40 ? text.substring(0, 40) + '...' : text
})

function handleAddChildNode(event) {
    event.stopPropagation()
    emit('add-child-node', { parentId: props.data.id })
}
</script>

<template>
    <Handle type="target" :position="Position.Top" class="custom-handle" :style="{ backgroundColor: layerColor }" />
    
    <!-- Connector Node (Success/Failure) - Simple text box -->
    <div 
        v-if="isConnector"
        class="connector-node"
        :style="{
            '--node-bg': nodeConfig.bgColor,
            '--node-border': nodeConfig.borderColor,
            '--text-color': nodeConfig.textColor
        }"
    >
        <span class="connector-text">{{ nodeTitle }}</span>
    </div>

    <!-- Regular Node -->
    <div 
        v-else
        class="custom-node"
        :class="{ 'custom-node--selected': selected }"
        :style="{
            '--node-bg': nodeConfig.bgColor,
            '--node-border': nodeConfig.borderColor,
            '--icon-bg': nodeConfig.iconBg,
            '--icon-color': nodeConfig.iconColor
        }"
    >
        <div class="node-icon">
            <v-icon :icon="nodeConfig.icon" size="18" />
        </div>
        <div class="node-content">
            <div class="node-title">{{ nodeTitle }}</div>
            <div v-if="nodeDescription" class="node-description">
                {{ nodeDescription }}
            </div>
        </div>
    </div>

    <Handle type="source" :position="Position.Bottom" class="custom-handle" :style="{ backgroundColor: layerColor }" />
    
    <!-- Trailing dashed line with plus button for leaf nodes -->
    <div v-if="isLeaf" class="trailing-line-container">
        <svg class="trailing-line" width="2" height="50" viewBox="0 0 2 50">
            <line 
                x1="1" y1="0" x2="1" y2="50" 
                :stroke="layerColor" 
                stroke-width="2" 
                stroke-dasharray="4 4"
            />
        </svg>
        <button 
            class="trailing-add-button"
            :style="{ backgroundColor: layerColor }"
            @click="handleAddChildNode"
            title="Add node here"
        >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M5 1V9M1 5H9" stroke="white" stroke-width="2" stroke-linecap="round"/>
            </svg>
        </button>
    </div>
</template>

<style scoped>
/* Regular Node */
.custom-node {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 16px;
    background: var(--node-bg);
    border: 2px solid var(--node-border);
    border-radius: 12px;
    min-width: 200px;
    max-width: 260px;
    cursor: grab;
    transition: box-shadow 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.custom-node:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.custom-node--selected {
    box-shadow: 0 0 0 3px rgba(255, 87, 34, 0.3), 0 4px 16px rgba(0, 0, 0, 0.1);
}

/* Connector Node (Success/Failure) */
.connector-node {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px 20px;
    background: var(--node-bg);
    border: 2px solid var(--node-border);
    border-radius: 8px;
    min-width: 80px;
    cursor: grab;
}

.connector-text {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-color);
}

.node-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    min-width: 32px;
    border-radius: 8px;
    background: var(--icon-bg);
    color: var(--icon-color);
}

.node-content {
    flex: 1;
    min-width: 0;
}

.node-title {
    font-size: 13px;
    font-weight: 600;
    color: #1a1a1a;
    line-height: 1.3;
    margin-bottom: 2px;
}

.node-description {
    font-size: 11px;
    color: #666;
    line-height: 1.4;
    word-break: break-word;
}

.custom-handle {
    width: 10px !important;
    height: 10px !important;
    border: 2px solid #fff !important;
    border-radius: 50% !important;
}

/* Trailing line with add button */
.trailing-line-container {
    position: absolute;
    bottom: -60px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 5;
}

.trailing-line {
    display: block;
}

.trailing-add-button {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
    margin-top: -2px;
}

.trailing-add-button:hover {
    transform: scale(1.15);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.25);
}
</style>
