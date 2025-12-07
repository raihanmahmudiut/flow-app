<script setup>
    import { ref, computed, watch } from 'vue'
    import { useFlowStore } from '../stores/flowStore'

    const props = defineProps(['modelValue', 'presetParentId'])
    const emit = defineEmits(['update:modelValue', 'create'])

    const store = useFlowStore()

    const valid = ref(false)
    const formData = ref({
        title: '',
        description: '',
        type: 'sendMessage',
        parentId: null,
    })

    // Watch for preset parent ID changes
    watch(() => props.presetParentId, (newVal) => {
        if (newVal) {
            formData.value.parentId = newVal
        }
    }, { immediate: true })

    // Watch for modal open to set preset
    watch(() => props.modelValue, (isOpen) => {
        if (isOpen && props.presetParentId) {
            formData.value.parentId = props.presetParentId
        }
    })

    const typeOptions = [
        { title: 'Send Message', value: 'sendMessage' },
        { title: 'Add Comments', value: 'addComment' },
        { title: 'Business Hours', value: 'businessHours' },
    ]

    const parentOptions = computed(() => {
        return store.nodes.map(node => ({ 
            title: node.data.name || node.data.type || 'Unknown Node',
            value: node.id,
        }))
    })

    const hasPresetParent = computed(() => !!props.presetParentId)
    
    const presetParentName = computed(() => {
        if (!props.presetParentId) return ''
        const node = store.nodes.find(n => n.id === props.presetParentId)
        return node?.data?.name || node?.data?.type || 'Unknown Node'
    })

    const rules = {
        required: value => !!value || 'Field is required'
    }

    function onSubmit() {
        if (!valid.value) return
        emit('create', formData.value)
        emit('update:modelValue', false)
        resetForm()
    }

    function resetForm() {
        formData.value = {
            title: '',
            description: '',
            type: 'sendMessage',
            parentId: props.presetParentId || null,
        }
    }
</script>

<template>
    <v-dialog 
        :model-value="modelValue" 
        @update:model-value="emit('update:modelValue', $event)"
        max-width="500"
    >
        <v-card class="create-node-card">
            <v-card-title class="card-title">
                <v-icon class="mr-2" color="primary">mdi-plus-circle</v-icon>
                Create New Node
            </v-card-title>
            
            <v-card-text>
                <v-form v-model="valid" @submit.prevent="onSubmit">
                    
                    <v-text-field
                        v-model="formData.title"
                        label="Node Title"
                        :rules="[rules.required]"
                        variant="outlined"
                        density="compact"
                        class="mb-3"
                    ></v-text-field>

                    <v-textarea
                        v-model="formData.description"
                        label="Description / Content"
                        :rules="[rules.required]"
                        variant="outlined"
                        density="compact"
                        rows="3"
                        class="mb-3"
                    ></v-textarea>

                    <v-select
                        v-model="formData.type"
                        :items="typeOptions"
                        label="Type of Node"
                        :rules="[rules.required]"
                        variant="outlined"
                        density="compact"
                        class="mb-3"
                    ></v-select>

                    <!-- Show preset parent info or parent selector -->
                    <div v-if="hasPresetParent" class="preset-parent-info">
                        <v-icon size="18" class="mr-2">mdi-link-variant</v-icon>
                        <span>Connecting to: <strong>{{ presetParentName }}</strong></span>
                    </div>
                    
                    <v-select
                        v-else
                        v-model="formData.parentId"
                        :items="parentOptions"
                        label="Attach to Parent"
                        :rules="[rules.required]"
                        variant="outlined"
                        density="compact"
                        hint="Select which node this connects to"
                        persistent-hint
                    ></v-select>

                </v-form>
            </v-card-text>

            <v-card-actions class="card-actions">
                <v-btn 
                    color="grey" 
                    variant="text" 
                    @click="emit('update:modelValue', false)"
                >
                    Cancel
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn 
                    variant="text" 
                    @click="resetForm"
                >
                    Reset
                </v-btn>
                <v-btn 
                    color="primary" 
                    variant="flat" 
                    @click="onSubmit" 
                    :disabled="!valid"
                    class="create-btn"
                >
                    Create Node
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<style scoped>
.create-node-card {
    border-radius: 16px !important;
}

.card-title {
    display: flex;
    align-items: center;
    padding: 20px 24px !important;
    font-size: 18px;
    font-weight: 600;
}

.card-actions {
    padding: 16px 24px !important;
    border-top: 1px solid #eee;
}

.create-btn {
    background: linear-gradient(135deg, #e91e63 0%, #ff5722 100%) !important;
}

.preset-parent-info {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    background: #f5f5f5;
    border-radius: 8px;
    font-size: 14px;
    color: #666;
}

.preset-parent-info strong {
    color: #333;
}
</style>
