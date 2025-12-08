<script setup>
/**
 * FlowStates - Presentational component for loading and error states
 * Shows appropriate UI based on current state
 */
defineProps({
    isLoading: { type: Boolean, default: false },
    isError: { type: Boolean, default: false },
    loadingText: { type: String, default: 'Loading workflow...' },
    errorText: { type: String, default: 'Failed to load flow data.' }
})
</script>

<template>
    <!-- Loading State -->
    <div v-if="isLoading" class="state-container loading-state">
        <v-progress-circular indeterminate color="primary" size="48" />
        <span class="state-text">{{ loadingText }}</span>
    </div>

    <!-- Error State -->
    <div v-else-if="isError" class="state-container error-state">
        <v-icon icon="mdi-alert-circle" size="48" color="error" />
        <span class="state-text">{{ errorText }}</span>
    </div>
</template>

<style scoped>
.state-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    gap: 16px;
    color: #666;
}

.state-text {
    font-size: 14px;
    color: #888;
}
</style>

