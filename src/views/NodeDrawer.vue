<script setup>
    import { computed, ref, watch } from 'vue'
    import { useRoute, useRouter } from 'vue-router'
    import { useFlowStore } from '../stores/flowStore'
    
    const route = useRoute()
    const router = useRouter()
    const store = useFlowStore()
    
    const activeNode = computed(() => {
      return store.nodes.find(n => n.id === route.params.id)
    })
    
    const nodeData = computed(() => activeNode.value ? activeNode.value.data : {})
    const nodeInternalData = computed(() => activeNode.value ? activeNode.value.data.data : {})
    

    const messageText = computed({
      get: () => {
        if (!nodeInternalData.value.payload) return '';
        const textObj = nodeInternalData.value.payload.find(p => p.type === 'text');
        return textObj ? textObj.text : '';
      },
      set: (val) => {
        if (nodeInternalData.value.payload) {
          const textObj = nodeInternalData.value.payload.find(p => p.type === 'text');
          if (textObj) textObj.text = val;
        }
      }
    })
    
    const businessTimes = computed(() => nodeInternalData.value.times || [])
    
    function closeDrawer() {
      router.push('/')
    }
    
    function deleteNode() {
      if (confirm('Are you sure you want to delete this node?')) {
        store.removeNode(activeNode.value.id)
        closeDrawer()
      }
    }
    </script>
    
    <template>

      <v-navigation-drawer
        location="right"
        width="400"
        permanent
        class="node-drawer"
      >
        <v-toolbar density="compact" color="grey-lighten-4">
          <v-btn icon="mdi-close" variant="text" @click="closeDrawer"></v-btn>
          <v-toolbar-title>Node Details</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn color="error" variant="text" icon="mdi-delete" @click="deleteNode"></v-btn>
        </v-toolbar>
    
        <div v-if="activeNode" class="pa-4">
          
          <v-text-field
            v-model="activeNode.data.name"
            label="Node Title"
            variant="outlined"
            class="mb-4"
            hide-details="auto"
          ></v-text-field>
    
          <v-divider class="mb-4"></v-divider>
    
          <div v-if="activeNode.data.type === 'sendMessage'">
            <h3 class="text-subtitle-1 mb-2 font-weight-bold">Message Content</h3>
            
            <v-textarea
              v-model="messageText"
              label="Message Text"
              variant="outlined"
              rows="4"
              auto-grow
            ></v-textarea>
    
            <h3 class="text-subtitle-1 mt-4 mb-2 font-weight-bold">Attachments</h3>
            <v-file-input
              label="Upload Attachment"
              variant="outlined"
              prepend-icon="mdi-paperclip"
              density="compact"
            ></v-file-input>
            
            <div v-for="(item, i) in nodeInternalData.payload" :key="i">
              <v-card v-if="item.type === 'attachment'" class="mt-2" border flat>
                 <v-img :src="item.attachment" height="150" cover></v-img>
                 <v-card-text class="text-caption text-truncate">
                   {{ item.attachment }}
                 </v-card-text>
              </v-card>
            </div>
          </div>
    
          <div v-if="activeNode.data.type === 'addComment'">
            <h3 class="text-subtitle-1 mb-2 font-weight-bold">Internal Comment</h3>
            <v-textarea
              v-model="nodeInternalData.comment"
              label="Comment"
              variant="outlined"
              rows="3"
            ></v-textarea>
          </div>
    
          <div v-if="activeNode.data.type === 'dateTime' || activeNode.data.type === 'businessHours'">
            <h3 class="text-subtitle-1 mb-2 font-weight-bold">Business Hours (UTC)</h3>
            
            <v-alert type="info" variant="tonal" density="compact" class="mb-3">
              Updates here affect the node logic.
            </v-alert>
    
            <div v-for="(time, index) in businessTimes" :key="index" class="d-flex align-center mb-2">
              <div style="width: 50px" class="font-weight-bold text-uppercase">{{ time.day }}</div>
              <input 
                type="time" 
                v-model="time.startTime" 
                class="time-input mr-2"
              />
              to
              <input 
                type="time" 
                v-model="time.endTime" 
                class="time-input ml-2"
              />
            </div>
          </div>
    
        </div>
    
        
        <div v-else class="pa-4 text-center text-grey">
          Node not found
        </div>
    
      </v-navigation-drawer>
    </template>
    
    <style scoped>
    .time-input {
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 4px;
    }
    </style>