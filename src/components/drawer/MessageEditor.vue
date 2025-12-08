<script setup>
/**
 * MessageEditor - Presentational component for editing message content
 * Shows message preview, editable textarea, and attachments
 */
defineProps({
    message: { type: String, default: '' },
    attachments: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:message', 'save'])

function handleInput(value) {
    emit('update:message', value)
}

function handleBlur() {
    emit('save')
}
</script>

<template>
    <div class="message-editor">
        <label class="field-label">Message:</label>
        <div class="message-preview">
            {{ message || 'No message content' }}
        </div>

        <v-textarea
            :model-value="message"
            @update:model-value="handleInput"
            @blur="handleBlur"
            label="Edit Message"
            variant="outlined"
            rows="4"
            auto-grow
            class="mt-4"
            hide-details
        />

        <template v-if="attachments.length > 0">
            <label class="field-label mt-4">Attachments</label>
            <div v-for="(item, i) in attachments" :key="i">
                <div class="attachment-card">
                    <v-img :src="item.attachment" height="120" cover class="attachment-image" />
                    <div class="attachment-name">
                        {{ item.attachment.split('/').pop() }}
                    </div>
                </div>
            </div>
        </template>
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

.message-preview {
    padding: 16px;
    background: #f8f9fa;
    border-radius: 12px;
    font-size: 14px;
    color: #333;
    line-height: 1.5;
    white-space: pre-wrap;
}

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
</style>

