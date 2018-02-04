"use strict";

/**
 *
 *  NAV-O
 *  An Alexa Skill for Accessing Public US Tide Data
 *
 *  Code for Hampton Roads
 *  MIT Licensed
 */

const Alexa = require("alexa-sdk");
const request = require("request");
const Fuse = require("fuse.js");
const config = require("./config");
const STATIONS = require("./stationdata");

const APP_ID = config.aws.skillId;

/**
 *
 *  These constants help us piece together the NAV-O response messages
 *
 */

const VALUES = {
  SKILL_NAME: "Nav-O",
  GET_TIDE_MESSAGE: "The current tide ",
  LOCATION_CONNECTOR: " at ",
  WATERLEVEL_CONNECTOR: " is: ",
  HELP_MESSAGE: {
    SPEECH:
      "Nav-O gets you the current water level from more than 10,000 water level sensors in the United States. To get the tide try asking 'what is the tide at,' and give me the name of a NOAA or <say-as interpret-as='spell-out'>USGS</say-as> tide station. You don't have to be exact, I'll take my best guess.",
    CARD:
      "Nav-O gets you the current water level from more than 10,000 water level sensors in the United States. To get the tide try asking 'what is the tide at,' and give me the name of a NOAA or USGS tide station. You don't have to be exact, I'll take my best guess."
  },
  HELP_REPROMPT: "What tide would you like me to report?",
  C4HR_MESSAGE:
    "Nav-O was built by Jason Wilson for Code for Hampton Roads as a tool for accessing publicly available tide data. Tide data is sourced fron the National Oceanic and Atmospheric Administration and United States Geological Survey sensors.  Code for Hampton Roads is a Civic Hacking Organization of volunteers dedicated to using publicly available data to help the Hampton Roads Community. Learn more at www.code4hr.org",
  STOP_MESSAGE: "Goodbye!",
  ERROR: "Uh Oh. Looks like something went wrong.",
  TIDE_UNITS_ft: " feet ",
  TIDE_RISING: " and rising",
  TIDE_FALLING: " and falling",
  NOT_FOUND: {
    SPEECH:
      "I'm sorry, I couldn't find that station. The station name should be the listed name of a NOAA or <say-as interpret-as='spell-out'>USGS</say-as> tide station.",
    CARD:
      "I'm sorry, I couldn't find that station. The station name should be the listed name of a NOAA or USGS tide station."
  },
  STATION_ERROR:
    "That station appears to be having an issue. I've made a note of the error, please try again later."
};

/**
 * fetchCurrentTide
 * @param id
 * @param water_level_endpoint
 * @returns water level report string
 *
 * Fetches water level for the station through its designated endpoint
 */

const fetchCurrentTide = function(
  id,
  name,
  water_level_endpoint,
  water_level_callback,
  skillthis
) {
  let endpoint_url = water_level_endpoint(id, Date.now());
  console.log("Endpoint: ", endpoint_url);
  const options = {
    url: endpoint_url,
    method: "GET",
    headers: {
      Accept: "application/json",
      "Accept-Charset": "utf-8",
      "User-Agent": "nav-o-lambda"
    }
  };
  let water_level_value = request(options, (err, res, body) => {
    water_level_callback(body, skillthis, name, VALUES);
  });
};

/**
 * Register and execute handler
 */

exports.handler = function(event, context, callback) {
  const alexa = Alexa.handler(event, context);

  if ("undefined" === typeof process.env.DEBUG) {
    alexa.appId = APP_ID;
  }

  if (!alexa.appId) {
    alexa.appId = alexa.APP_ID;
  }

  alexa.registerHandlers(handlers);
  console.log(`Beginning execution for skill with APP_ID=${alexa.appId}`);
  alexa.execute();
  //console.log(`Ending execution for skill with APP_ID=${alexa.appId}`);
};

const handlers = {
  LaunchRequest: function() {
    console.info("LaunchRequest Called");
    this.emit("AMAZON.HelpIntent");
  },
  AboutIntent: function() {
    console.info("AboutIntent Called");
    this.response.cardRenderer(VALUES.SKILL_NAME, VALUES.C4HR_MESSAGE);
    this.response.speak(VALUES.C4HR_MESSAGE);
    this.response.listen(VALUES.HELP_REPROMPT);
    this.emit(":responseReady");
  },
  StationNotFoundIntent: function() {
    console.info("StationNotFoundIntent Called");
    this.response.cardRenderer(VALUES.SKILL_NAME, VALUES.NOT_FOUND.CARD);
    this.response.speak(VALUES.NOT_FOUND.SPEECH);
    this.emit(":responseReady");
  },
  StationErrorIntent: function() {
    console.info("StationErrorIntent Called");
    this.response.cardRenderer(VALUES.SKILL_NAME, VALUES.STATION_ERROR);
    this.response.speak(VALUES.STATION_ERROR);
    this.emit(":responseReady");
  },
  "AMAZON.HelpIntent": function() {
    //this.emit(":ask", VALUES.HELP_MESSAGE, VALUES.HELP_REPROMPT);
    this.response.cardRenderer(VALUES.SKILL_NAME, VALUES.HELP_MESSAGE.CARD);
    this.response.speak(VALUES.HELP_MESSAGE.SPEECH);
    this.response.listen(VALUES.HELP_REPROMPT);
    this.emit(":responseReady");
  },
  "AMAZON.CancelIntent": function() {
    this.emit(":tell", VALUES.STOP_MESSAGE);
  },
  "AMAZON.StopIntent": function() {
    this.emit(":tell", VALUES.STOP_MESSAGE);
  },
  Unhandled: function() {
    //this.emit(":ask", VALUES.HELP_MESSAGE, VALUES.HELP_MESSAGE);
    this.response.cardRenderer(VALUES.SKILL_NAME, VALUES.HELP_MESSAGE.CARD);
    this.response.speak(VALUES.HELP_MESSAGE.SPEECH);
    this.response.listen(VALUES.HELP_REPROMPT);
    this.emit(":responseReady");
  },
  GetTideIntent: function() {
    /**
     *
     *  Capture the Station Name, Identify the Station ID, and retrieve the Tide
     */

    console.info("GetTideIntent Called");

    let location = this.event.request.intent.slots.Location.value;

    console.log("Location: ", location);

    let options = {
      shouldSort: true,
      threshold: 0.6,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 1,
      keys: ["name"]
    };
    var fuse = new Fuse(STATIONS, options);
    var result = fuse.search(location);

    if (typeof result[0] !== "undefined" && result[0]) {
      console.log("Fuse result: ", result[0]);
      let station = result[0];

      console.log(
        "Value: ",
        fetchCurrentTide(
          station.id,
          station.name,
          station.water_level_endpoint,
          station.water_level_callback,
          this
        )
      );
    } else {
      this.emit("StationNotFoundIntent");
    }
  }
};
