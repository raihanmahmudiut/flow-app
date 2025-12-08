<script setup>
/**
 * FlowToolbar - Presentational component for undo/redo controls
 * Displays undo and redo buttons with disabled states
 */
defineProps({
    canUndo: { type: Boolean, default: false },
    canRedo: { type: Boolean, default: false }
})

const emit = defineEmits(['undo', 'redo'])
</script>

<template>
    <div class="toolbar">
        <v-btn-group density="comfortable" variant="flat" class="toolbar-group">
            <v-btn
                :disabled="!canUndo"
                @click="emit('undo')"
                icon="mdi-undo"
                title="Undo (Ctrl+Z)"
                size="small"
            />
            <v-btn
                :disabled="!canRedo"
                @click="emit('redo')"
                icon="mdi-redo"
                title="Redo (Ctrl+Y)"
                size="small"
            />
        </v-btn-group>
    </div>
</template>

<style scoped>
.toolbar {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 10;
    display: flex;
    gap: 12px;
    align-items: center;
}

.toolbar-group {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
</style>

