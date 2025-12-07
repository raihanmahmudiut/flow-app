<script setup>
    import { ref, computed } from 'vue'
    import { useFlowStore } from '../stores/flowStore'

    const props = defineProps(['modelValue'])
    const emit = defineEmits(['update:modelValue', 'create'])

    const store = useFlowStore()

    const valid = ref(false)
    const formData = ref({
        title: '',
        description: '',
        type: 'sendMessage',
        parentId: null,
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

    const rules = {
        required: value => !!value || 'Field is required'
    }

    function onSubmit() {
        if (!valid.value) return
        emit('create', formData.value)
        emit('update:modelValue', false)
        formData.value = {
            title: '',
            description: '',
            type: 'sendMessage',
            parentId: null,
        }
    }

    function resetForm() {
        formData.value = {
            title: '',
            description: '',
            type: 'sendMessage',
            parentId: null,
        }
    }
</script>

<template>
    <v-dialog 
    :model-value="modelValue" 
    @update:model-value="emit('update:modelValue', $event)"
    max-width="500"
  >
    <v-card>
      <v-card-title class="headline">Create New Node</v-card-title>
      
      <v-card-text>
        <v-form v-model="valid" @submit.prevent="onSubmit">
          
          <v-text-field
            v-model="formData.title"
            label="Node Title"
            :rules="[rules.required]"
            variant="outlined"
            density="compact"
            class="mb-2"
          ></v-text-field>

          <v-textarea
            v-model="formData.description"
            label="Description"
            :rules="[rules.required]"
            variant="outlined"
            density="compact"
            rows="3"
            class="mb-2"
          ></v-textarea>

          <v-select
            v-model="formData.type"
            :items="typeOptions"
            label="Type of Node"
            :rules="[rules.required]"
            variant="outlined"
            density="compact"
            class="mb-2"
          ></v-select>

          <v-select
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

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey" variant="text" @click="emit('update:modelValue', false)">Cancel</v-btn>
        <v-btn color="primary" variant="flat" @click="onSubmit" :disabled="!valid">Create</v-btn>
        <v-btn color="primary" variant="flat" @click="resetForm">Reset</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.v-dialog {
    width: 500px;
}
</style>