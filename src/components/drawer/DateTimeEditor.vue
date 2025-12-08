<script setup>
/**
 * DateTimeEditor - Presentational component for editing business hours
 * Handles day/time toggle, time grid, and timezone selection
 */
import { computed } from 'vue'

const props = defineProps({
    times: { type: Array, required: true },
    timezone: { type: String, default: 'UTC' },
    timezoneOptions: { 
        type: Array, 
        default: () => ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London'] 
    }
})

const emit = defineEmits(['update:times', 'update:timezone', 'save'])

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Local copy for v-model binding
const localTimes = computed({
    get: () => props.times,
    set: (val) => emit('update:times', val)
})

const localTimezone = computed({
    get: () => props.timezone,
    set: (val) => {
        emit('update:timezone', val)
        emit('save')
    }
})

function handleTimeChange(index, field, value) {
    const newTimes = [...props.times]
    newTimes[index] = { ...newTimes[index], [field]: value }
    emit('update:times', newTimes)
    emit('save')
}
</script>

<template>
    <div class="datetime-editor">
        <p class="section-description">
            Allows a branch to be created based on date & time conditions. 
            Use it to set business hours or date range conditions.
        </p>

        <div class="toggle-tabs">
            <button class="toggle-tab active">
                <v-icon size="16" class="mr-1">mdi-calendar</v-icon>
                Day
            </button>
            <button class="toggle-tab">
                <v-icon size="16" class="mr-1">mdi-clock-outline</v-icon>
                Time
            </button>
        </div>

        <div class="time-grid">
            <div 
                v-for="(time, index) in localTimes" 
                :key="index" 
                class="time-row"
            >
                <span class="day-label">{{ daysOfWeek[index] || time.day }}</span>
                <div class="time-inputs">
                    <div class="time-input-wrapper">
                        <input 
                            type="time" 
                            :value="time.startTime"
                            @change="handleTimeChange(index, 'startTime', $event.target.value)"
                            class="time-input"
                        />
                        <v-icon size="14" class="time-icon">mdi-clock-outline</v-icon>
                    </div>
                    <span class="time-separator">to</span>
                    <div class="time-input-wrapper">
                        <input 
                            type="time" 
                            :value="time.endTime"
                            @change="handleTimeChange(index, 'endTime', $event.target.value)"
                            class="time-input"
                        />
                        <v-icon size="14" class="time-icon">mdi-clock-outline</v-icon>
                    </div>
                </div>
            </div>
        </div>

        <div class="timezone-section">
            <label class="field-label">Time Zone</label>
            <v-select
                v-model="localTimezone"
                :items="timezoneOptions"
                variant="outlined"
                density="compact"
                hide-details
                class="timezone-select"
            />
        </div>
    </div>
</template>

<style scoped>
.datetime-editor {
    /* Container styles */
}

.section-description {
    font-size: 13px;
    color: #666;
    line-height: 1.5;
    margin-bottom: 20px;
}

/* Toggle tabs */
.toggle-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
}

.toggle-tab {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background: #fff;
    font-size: 13px;
    color: #666;
    cursor: pointer;
    transition: all 0.2s;
}

.toggle-tab.active {
    background: #f5f5f5;
    border-color: #ccc;
    color: #333;
}

.toggle-tab:hover {
    border-color: #bbb;
}

/* Time grid */
.time-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 24px;
}

.time-row {
    display: flex;
    align-items: center;
    gap: 16px;
}

.day-label {
    width: 40px;
    font-size: 13px;
    font-weight: 500;
    color: #333;
}

.time-inputs {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
}

.time-input-wrapper {
    position: relative;
    flex: 1;
}

.time-input {
    width: 100%;
    padding: 10px 12px;
    padding-right: 32px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    font-size: 13px;
    color: #333;
    background: #fff;
    transition: border-color 0.2s;
}

.time-input:focus {
    outline: none;
    border-color: #ff6b4a;
}

.time-icon {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: #999;
    pointer-events: none;
}

.time-separator {
    font-size: 13px;
    color: #888;
}

/* Timezone */
.timezone-section {
    margin-top: 24px;
}

.field-label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: #888;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.timezone-select {
    font-size: 13px;
}
</style>

