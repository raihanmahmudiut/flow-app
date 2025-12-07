<script setup>
import { computed } from 'vue'
import { getBezierPath, EdgeLabelRenderer } from '@vue-flow/core'

const props = defineProps({
    id: String,
    source: String,
    target: String,
    sourceX: Number,
    sourceY: Number,
    targetX: Number,
    targetY: Number,
    sourcePosition: String,
    targetPosition: String,
    data: Object,
    markerEnd: String,
    style: Object
})

const emit = defineEmits(['add-node'])

const edgeColor = computed(() => props.data?.color || '#ff5722')

const path = computed(() => {
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX: props.sourceX,
        sourceY: props.sourceY,
        sourcePosition: props.sourcePosition,
        targetX: props.targetX,
        targetY: props.targetY,
        targetPosition: props.targetPosition,
    })
    return { edgePath, labelX, labelY }
})

function handleAddNode() {
    emit('add-node', {
        sourceId: props.source,
        targetId: props.target,
        position: { x: path.value.labelX, y: path.value.labelY }
    })
}
</script>

<template>
    <path
        :id="id"
        class="vue-flow__edge-path custom-edge-path"
        :d="path.edgePath"
        :marker-end="markerEnd"
        :style="{ stroke: edgeColor, strokeWidth: 2 }"
    />
    
    <EdgeLabelRenderer>
        <div
            class="edge-button-container nodrag nopan"
            :style="{
                transform: `translate(-50%, -50%) translate(${path.labelX}px, ${path.labelY}px)`,
                pointerEvents: 'all'
            }"
        >
            <button 
                class="edge-add-button"
                :style="{ backgroundColor: edgeColor }"
                @click="handleAddNode"
                title="Add node here"
            >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M5 1V9M1 5H9" stroke="white" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </button>
        </div>
    </EdgeLabelRenderer>
</template>

<style>
.custom-edge-path {
    fill: none;
    stroke-linecap: round;
}

.edge-button-container {
    position: absolute;
    z-index: 10;
}

.edge-add-button {
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
}

.edge-add-button:hover {
    transform: scale(1.15);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.25);
}
</style>

