<script setup>
/**
 * CommentEditor - Presentational component for editing comments
 * Simple textarea for internal comments
 */
defineProps({
    comment: { type: String, default: '' }
})

const emit = defineEmits(['update:comment', 'save'])

function handleInput(value) {
    emit('update:comment', value)
}

function handleBlur() {
    emit('save')
}
</script>

<template>
    <div class="comment-editor">
        <label class="field-label">Internal Comment</label>
        <v-textarea
            :model-value="comment"
            @update:model-value="handleInput"
            @blur="handleBlur"
            label="Comment"
            variant="outlined"
            rows="3"
            hide-details
        />
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
</style>

