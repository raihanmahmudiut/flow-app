<script setup>
/**
 * TriggerInfo - Presentational component for displaying trigger information
 * Read-only display of trigger type
 */
import { computed } from 'vue'

const props = defineProps({
    triggerType: { type: String, default: '' }
})

const displayType = computed(() => {
    return props.triggerType === 'conversationOpened' 
        ? 'Conversation Opened' 
        : props.triggerType || 'Unknown Trigger'
})
</script>

<template>
    <div class="trigger-info">
        <label class="field-label">Trigger Type</label>
        <div class="info-card">
            <v-icon size="20" class="mr-2" color="primary">mdi-flash</v-icon>
            {{ displayType }}
        </div>
    </div>
</template>

<style scoped>
.field-label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: #888;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.info-card {
    display: flex;
    align-items: center;
    padding: 14px 16px;
    background: #f8f9fa;
    border-radius: 10px;
    font-size: 14px;
    color: #333;
}
</style>

