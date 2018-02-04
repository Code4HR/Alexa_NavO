'use strict';

/**
 *
 *  NAV-O
 *  An Alexa Skill for Accessing Public US Tide Data
 *
 *  Code for Hampton Roads
 *  See LICENSE.txt for License
 */


/**
 * Alias skill handler to root.
 * This will make the default lambda value of "index.handler" work.
 */

const AlexaSkill = require('./src/index');

exports.handler = AlexaSkill.handler;
