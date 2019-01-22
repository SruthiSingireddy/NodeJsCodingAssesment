import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'

Vue.use(Vuex)


export default new Vuex.Store({
    state: {
        events: [],
        bearerToken: false
    },
    mutations: {
        // TODO create state mutations
        submitBearerToken: function( state, token ) {
            state.bearerToken = `bearer ${token}`;

            axios.interceptors.request.use(function (config) {
                config.headers['X-API-AUTH'] = state.bearerToken;
                return config;
              });
        },
        fetchEvents: function(state) {
            axios.get('/events').then((response) => {
                state.events = response.data.message;
            });
        },
        eventUpdateFailed: function(state, error) {
            state.eventUpdateError = error;
        }
    },
    actions: {
        // TODO calls to events api backend (not yet created)
        deleteEvent: function( { commit }, eventId ) {
            axios.delete('/event/'+eventId).then((response) => {
                commit('fetchEvents');
            });
        },
        modifyEvent: ( { commit }, calendarEvent ) => {
            axios.put('/event/'+calendarEvent.id,calendarEvent).then((response) => {});
        },
        createEvent: ( { commit,state }, calendarEvent ) => {
            axios.post('/event',calendarEvent)
                .then((response) => { })
                .catch(error => {
                    console.log(error.response.data.error)
                    commit('eventUpdateFailed', error.response.data.error);
                })
        }
    }
})
