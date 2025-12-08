<script setup>
/**
 * DrawerHeader - Presentational component for drawer headers
 * Displays an icon, title, subtitle, and close button
 */
defineProps({
    icon: { type: String, required: true },
    iconColor: { type: String, default: '#666' },
    bgColor: { type: String, default: '#f5f5f5' },
    title: { type: String, required: true },
    subtitle: { type: String, default: '' }
})

const emit = defineEmits(['close'])
</script>

<template>
    <div class="drawer-header">
        <div class="header-icon" :style="{ background: bgColor }">
            <v-icon :icon="icon" :color="iconColor" size="24" />
        </div>
        <div class="header-content">
            <h2 class="header-title">{{ title }}</h2>
            <p v-if="subtitle" class="header-subtitle">{{ subtitle }}</p>
        </div>
        <v-btn 
            icon="mdi-close" 
            variant="text" 
            size="small"
            @click="emit('close')"
            class="close-btn"
        />
    </div>
</template>

<style scoped>
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
</style>

