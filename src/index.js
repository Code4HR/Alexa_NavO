'use strict';

/**
 *
 *  NAV-O
 *  An Alexa Skill for Accessing Public US Tide Data
 *
 *  Code for Hampton Roads
 *  MIT Licensed
 */

const Alexa = require('alexa-sdk');
const config = require('./config');
const Fuse = require('fuse.js');

const APP_ID = config.aws.skillId;

/**
 *
 *  These constants help us piece together the NAV-O response messages
 *
 */

const SKILL_NAME = "Nav-O";
const GET_TIDE_MESSAGE = "The current tide ";
const LOCATION_CONNECTOR = " at ";
const WATERLEVEL_CONNECTOR = " is: ";
const HELP_MESSAGE = "You can say 'what is the tide at station name,' where station name is the name of a NOAA Tide Station, you can ask about Code for Hampton Roads, or, you can say 'exit'... What can I help you with?";
const HELP_REPROMPT = "What can I help you with?";
const C4HR_MESSAGE = "Code for Hampton Roads is a Civic Hacking Organization of volunteers dedicated to using publicly available data to help the Hampton Roads Community. Learn more at www.code4hr.org";
const STOP_MESSAGE = "Goodbye!";
const ERROR = "Uh Oh. Looks like something went wrong.";
const TIDE_UNITS_ft = " feet ";
const TIDE_RISING = " and rising";
const TIDE_FALLING = " and falling";

/**
 * Register and execute handler
 */

exports.handler = function(event, context, callback) {
  const alexa = Alexa.handler(event, context);
  alexa.appId = APP_ID;
  alexa.registerHandlers(handlers);
  console.log(`Beginning execution for skill with APP_ID=${alexa.appId}`);
  alexa.execute();
  console.log(`Ending execution for skill with APP_ID=${alexa.appId}`);
};

const handlers = {
  'LaunchRequest': function() {
    console.info("LaunchRequest Called");
    this.emit('GetTideIntent');
  },
  "AboutIntent": function () {
    this.emit(':tellWithCard', C4HR_MESSAGE, SKILL_NAME, C4HR_MESSAGE);
  },
  'AMAZON.HelpIntent': function() {
    this.emit(':ask', HELP_MESSAGE, HELP_REPROMPT);
  },
  'AMAZON.CancelIntent': function() {
    this.emit(':tell', STOP_MESSAGE);
  },
  'AMAZON.StopIntent': function() {
    this.emit(':tell', STOP_MESSAGE);
  },
  'Unhandled': function() {
    this.emit(':ask', HELP_MESSAGE, HELP_MESSAGE);
  },
  'GetTideIntent': function() {
  
    /**
     *
     *  Capture the Station Name, Identify the Station ID, and retrieve the Tide
     */

    const intent = this;
  
    const fuse_options = {
      keys: ['name'],
      id: 'id'
    };
    
    let fuse = new Fuse(STATTIONS, fuse_options);
  
    let station_id = fuse.search(this.event.request.intent.slots.Location.value); // Use fuse library to fuzzy search for the user input

}