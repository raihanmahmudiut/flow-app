<script setup>
/**
 * TrailingLine - Presentational component for leaf node trailing indicator
 * Shows a dashed line with a plus button to add child nodes
 */
defineProps({
    color: { type: String, default: '#ff5722' }
})

const emit = defineEmits(['add-node'])

function handleClick(event) {
    event.stopPropagation()
    emit('add-node')
}
</script>

<template>
    <div class="trailing-line-container">
        <svg class="trailing-line" width="2" height="50" viewBox="0 0 2 50">
            <line 
                x1="1" y1="0" x2="1" y2="50" 
                :stroke="color" 
                stroke-width="2" 
                stroke-dasharray="4 4"
            />
        </svg>
        <button 
            class="trailing-add-button"
            :style="{ backgroundColor: color }"
            @click="handleClick"
            title="Add node here"
        >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M5 1V9M1 5H9" stroke="white" stroke-width="2" stroke-linecap="round"/>
            </svg>
        </button>
    </div>
</template>

<style scoped>
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

