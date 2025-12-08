<script setup>
/**
 * KeyboardHelp - Presentational component for keyboard shortcuts hint
 * Shows available keyboard shortcuts in a subtle overlay
 */
defineProps({
    shortcuts: { 
        type: String, 
        default: 'Enter: Edit · Delete: Remove · Ctrl+Z/Y: Undo/Redo' 
    }
})
</script>

<template>
    <div class="keyboard-help">
        <v-icon size="14" class="mr-1">mdi-keyboard</v-icon>
        {{ shortcuts }}
    </div>
</template>

<style scoped>
.keyboard-help {
    position: absolute;
    bottom: 20px;
    left: 20px;
    z-index: 10;
    display: flex;
    align-items: center;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(8px);
    border-radius: 8px;
    font-size: 11px;
    color: #666;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    opacity: 0.7;
    transition: opacity 0.2s;
}

.keyboard-help:hover {
    opacity: 1;
}
</style>

