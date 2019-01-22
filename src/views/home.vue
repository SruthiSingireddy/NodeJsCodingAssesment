<template>
    <div>
        <Day v-for="day in eventDays" :dateTime="day.data.date" :eventList="day.data.events" :key="day.id" />
    </div>
</template>

<script>
// @ is an alias to /src
import Day from '@/components/day.vue'

export default {
    name: 'home',
    components: {
        Day
    },
    created () {
        // fetch the data when the view is created and the data is
        // already being observed
        this.fetchData()
    },
    computed: {
        eventDays() {
            return this.$store.state.events
        }
    },

    methods: {
        fetchData() {
            this.$store.commit( 'fetchEvents' );
        }
    }
}
</script>
