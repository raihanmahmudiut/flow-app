<script setup>
import { Handle, Position} from '@vue-flow/core'
import {computed} from 'vue'

const props = defineProps(['data', 'selected'])

const nodeIcon = computed(()=> {
    switch (props.data.type) {
        case 'trigger': return 'mdi-flash';
        case 'sendMessage': return 'mdi-message-text-outline';
        case 'dateTime': return 'mdi-clock-outline';
        case 'addComment': return 'mdi-comment-text-outline';
        // For connector nodes, we check the nested 'data.connectorType' to see if it's success (check) or failure (X)
        case 'dateTimeConnector': 
        return props.data.data.connectorType === 'success' ? 'mdi-check' : 'mdi-close';
        default: return 'mdi-circle-outline';
    }
})

const nodeTitle = computed(()=> {
    if(props.data.name) return props.data.name;
    if(props.data.type == 'trigger') return 'Trigger';
    if(props.data.type == 'sendMessage') return 'Send Message';
    if(props.data.type == 'addComment') return 'Add Comment';
    if(props.data.type == 'dateTime') return 'Date Time';
    if(props.data.type == 'dateTimeConnector') return 'Date Time Connector';
    return 'Unknown Node'; 
})

const nodeDescription = computed(()=> {
    const d = props.data.data;
    if(!d) return ''

    let text = ''

    if (props.data.type == 'Trigger') {
        text = d.type
    } else if (props.data.type === 'sendMessage' && d.payload) {
        const textObj = d.payload.find(p => p.type === 'text');
        text = textObj ? textObj.text : 'Attachment Only'
    } else if (props.data.type === 'addComment') {
        text = d.comment
    } else if (props.data.type === 'dateTime') {
        text = d.timezone || 'Business Hours'
    }

    return text.length > 35 ? text.substring(0, 35) + '...' : text
})

const isConnector = computed(()=> props.data.type === 'dateTimeConnector')
</script>

<template>
    <Handle type="target" :position="Position.Top"/>
    <v-card
        width = "250"
        :elevation = "selected ? 8 : 2"
        :class="['node-card', {'selected-node': selected}]"
        :color="isConnector ? 'grey-lighten-4' : 'white'"
        density="compact"
    >
        <v-card-item>
            <template v-slot:prepend>
                <v-icon :icon="nodeIcon" color="primary"></v-icon>
            </template>
            <v-card-title class="text-subtitle-2 font-weight-bold">
                {{nodeTitle}}
            </v-card-title>
            <v-card-subtitle class="text-caption">
                {{ nodeDescription }}
            </v-card-subtitle>
        </v-card-item>
    </v-card>
    <Handle type="source" :position="Position.Bottom" />
</template>

<style scoped>
    .node-card{
        border-radius: 8px;
        cursor: grab;
    }
    .selected-node {
        border: 2px solid #1867C0;
    }
</style>