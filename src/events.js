  /*jshint esnext:true*/
  const express = require('express')
  const router = express.Router()
const request = require('request')
const moment = require('moment')
const uuidv4 = require('uuid/v4')

const MAX_EVENT_SPAN = 3;
const STORAGE_API_KEY = 'b2b20ed1-f3b0-4010-8441-8adb4156c010';


  const  lookUpEvents = (req,res)=>{
      var options = {
          method: 'GET',
          url: 'https://crud-api.azurewebsites.net/api/peek',
          headers: {
              'cache-control': 'no-cache',
              Accept: 'application/json',
              'X-API-KEY': STORAGE_API_KEY,
              'Content-Type': 'application/json'
          }
      };

    return new Promise((resolve, reject) => {
        request.get(options, (err, httpResponse, body) => {
            if (err) {
                return reject(err);
            }
            resolve(body);
        })
    });
  }

  const postEvent  = (data,id,res)=>{
      var options = {
          method: 'POST',
          url: 'https://crud-api.azurewebsites.net/api/create/'+id,
          headers: {
              Accept: 'application/json',
              'X-API-KEY': STORAGE_API_KEY,
              'Content-Type': 'application/json'
          },
          body: {
            data
          },
          json: true
      };

      request(options, function(err, httpResponse, body) {
          res.json(body);
      })
  }

  const putEvent  = (data,id,res)=>{
    var options = {
          method: 'PUT',
          url: 'https://crud-api.azurewebsites.net/api/update/'+id,
          headers: {
              Accept: 'application/json',
              'X-API-KEY': STORAGE_API_KEY,
              'Content-Type': 'application/json'
          },
          body: data,
          json: true
      };

      request(options, function(err, httpResponse, body) {
          res.json(body);
      })
  }
  //get all events
  router.get('/events', (req, res) => {
    lookUpEvents(req, res)
        .then(response => res.send(response))
        .catch(error => res.send(error))
  });

  // to post a new event
  router.post('/event', (req, res) => {
      const newEvent = {
          id: uuidv4(),
          name: req.body.name,
          dateTime: moment.parseZone(req.body.dateTime).utc().format(),
          duration: req.body.duration,
          brief:  req.body.brief
      };

      if(Number(newEvent.duration) === 'NaN') {
        res.status(500).send({
              status: 'error',
              error: "Please enter duration in minutes"
            });
      }

      lookUpEvents(req, res)
        .then(response => {
          let error 
          let matchedDay

          const days = JSON.parse(response).message;
          days.forEach((day) => {
           const isSameDay= moment(day.data.date).isSame(newEvent.dateTime, 'days');
           const isBeyondEventSpan = Math.abs(moment(day.data.date).diff(newEvent.dateTime, 'days')) >= MAX_EVENT_SPAN;

           if (isBeyondEventSpan) {
            error = "New event is beyond current span of events";
            return;
           }
           
           if(isSameDay){
            const events = day.data.events;
            
            events.forEach((event) => {
              const endTime = moment(newEvent.dateTime).add(newEvent.duration, 'minutes');
              const isEventOverlap = moment(event.dateTime).isBetween(newEvent.dateTime, endTime, null, '[)') || 
                                        moment(event.dateTime).add(event.duration, 'minutes').isBetween(newEvent.dateTime, endTime, null, '()'); 

              if(isEventOverlap){
               error = "Event is overlapping"
               return 
              }
            })
            matchedDay=day
           }
          })

          if(error){
            res.status(500).send({
              status: 'error',
              error: error
            });
          } else if (matchedDay){
            
            matchedDay.data.events.push(newEvent)
            putEvent(matchedDay,matchedDay.name, res)
          }else{
               const newDay = {
                  date: newEvent.dateTime,
                  id: uuidv4(),
                  events: [newEvent]
              }
              postEvent(newDay,uuidv4(), res)
          }
        })
        .catch(error => res.send(error))
  })

  // to GET any specfic event by id
  router.get('/:id', (req, res) => {
      var reqId = req.params.id;
      var options = {
          method: 'GET',
          url: 'https://crud-api.azurewebsites.net/api/read/' + reqId,
          headers: {
              'cache-control': 'no-cache',
              Accept: 'application/json',
              'X-API-KEY': STORAGE_API_KEY,
              'Content-Type': 'application/json'
          }
      };

      request.get(options, (err, httpResponse, body) => {
          res.json(body);
      })
  });


  // to Modify any specfic event by id
  router.put('/event/:id', (req, res) => {
    const updatedEvent = {
          id: req.body.id,
          name: req.body.name,
          dateTime: moment.parseZone(req.body.dateTime).utc().format(),
          duration: req.body.duration,
          brief:  req.body.brief
      };

      if(Number(updatedEvent.duration) === 'NaN') {
        res.status(500).send({
              status: 'error',
              error: "Please enter duration in minutes"
            });
      }

      lookUpEvents(req, res)
        .then(response => {
          let error 
          let matchedDay

          const days = JSON.parse(response).message;
          days.forEach((day) => {
           const isSameDay= moment(day.data.date).isSame(updatedEvent.dateTime, 'days');
           const isBeyondEventSpan = Math.abs(moment(day.data.date).diff(updatedEvent.dateTime, 'days')) >= MAX_EVENT_SPAN;

           if (isBeyondEventSpan) {
            error = "New event is beyond current span of events";
            return;
           }
           
           if(isSameDay){
            const events = day.data.events;
            
            events.forEach((event) => {
              const endTime = moment(updatedEvent.dateTime).add(updatedEvent.duration, 'minutes');
              const isEventOverlap = moment(event.dateTime).isBetween(updatedEvent.dateTime, endTime, null, '[)') || 
                                        moment(event.dateTime).add(event.duration, 'minutes').isBetween(updatedEvent.dateTime, endTime, null, '()'); 

              if(isEventOverlap && updatedEvent.id !== event.id) {
               error = "Event is overlapping"
               return 
              }
            })
            matchedDay=day
           }
          })

          if(error){
            res.status(500).send({
              status: 'error',
              error: error
            });
          } else if (matchedDay) {
            
            matchedDay.data.events.forEach((event, key) => {
              if (event.id === updatedEvent.id) {
                matchedDay.data.events[key] = updatedEvent;
              }
            })

            putEvent(matchedDay, matchedDay.name, res)
          } else {
            res.status(500).send({
              status: 'error',
              error: "Something went wrong while updating event"
            });
          }
        })
        .catch(error => res.send(error))
  });

  function deleteEvent(id, res) {
      var options = {
          method: 'DELETE',
          url: 'https://crud-api.azurewebsites.net/api/remove/' + id,
          headers: {
              'cache-control': 'no-cache',
              Accept: 'application/json',
              'X-API-KEY': STORAGE_API_KEY,
              'Content-Type': 'application/json'
          }
      };

      request.delete(options, (err, httpResponse, body) => {
          res.json(body);
      })
  }

  // Delete a specific event by id
  router.delete('/event/:id', (req, res) => {
      const deletedEventId = req.params.id;
      
      lookUpEvents(req, res)
        .then(response => {
          let error 
          let matchedDay;
          let matchedEventIndex;

          const days = JSON.parse(response).message;
          matchedDay = days.find((day) => {
            const events = day.data.events;
            
            matchedEventIndex = events.findIndex((event) => {
              return event.id === deletedEventId
            })

            return matchedEventIndex >= 0;
          })

          if(error){
            res.status(500).send({
              status: 'error',
              error: error
            });
          } else if (matchedDay && matchedEventIndex >= 0) {
            
            if(matchedDay.data.events.length === 1) {
              // delete row
              deleteEvent(matchedDay.name, res);
            } else {
              // delete event
              matchedDay.data.events = [].concat(matchedDay.data.events.slice(0, matchedEventIndex), matchedDay.data.events.slice(matchedEventIndex + 1, matchedDay.data.events.length));
              
              putEvent(matchedDay, matchedDay.name, res)
            }
          } else {
            res.status(500).send({
              status: 'error',
              error: "Something went wrong locating the event"
            });
          }
        })
        .catch(error => res.send(error))
  });

  module.exports = router