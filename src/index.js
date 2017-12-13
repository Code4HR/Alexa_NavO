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
 *
 * Tide Station Data List
 */

const NOAA_COOPS_WL_ENDPOINT = (id, end_date) => {
  if (!id) { return null }
  let time = new Date;
  end_date = end_date || time.toISOString().replace(/-/g, '').replace(/T/,' ').substr(0, 15);
  let start_date = time.setMinutes(time.getMinutes() - 12).toISOString().replace(/-/g, '').replace(/T/,' ').substr(0, 15);
  return `https://tidesandcurrents.noaa.gov/api/datagetter?begin_date=${start_date}&end_date=${end_date}&station=${id}&product=water_level&datum=mllw&units=english&time_zone=gmt&application=code4hr&format=json`
}

const USGS_WL_ENDPOINT = (id, end_date) => {
  if(!id) { return null }
  let time = new Date;
}

const STATTIONS = [
  {id:'8739803', name:'Bayou La Batre Bridge, AL', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8737138', name:'Chickasaw Creek, AL', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8736897', name:'Coast Guard Sector Mobile, AL', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8735180', name:'Dauphin Island, AL', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8735391', name:'Dog River Bridge, AL', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8735523', name:'East Fowl River Bridge, AL', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8737048', name:'Mobile State Docks, AL', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8732828', name:'Weeks Bay, Mobile Bay, AL', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8738043', name:'West Fowl River Bridge, AL', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9461380', name:'Adak Island, AK', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9457804', name:'Alitak, AK', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9455920', name:'Anchorage, AK', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9461710', name:'Atka, AK', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9454050', name:'Cordova, AK', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9452634', name:'Elfin Cove, AK', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9452210', name:'Juneau, AK', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9450460', name:'Ketchikan, AK', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9459881', name:'King Cove, AK', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9457292', name:'Kodiak Island, AK', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9455760', name:'Nikiski, AK', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9462450', name:'Nikolski, AK', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9468756', name:'Nome, Norton Sound, AK', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9451054', name:'Port Alexander, AK', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9463502', name:'Port Moller, AK', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9497645', name:'Prudhoe Bay, AK', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9491094', name:'Red Dog Dock, AK', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9459450', name:'Sand Point, AK', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9455500', name:'Seldovia, AK', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9455090', name:'Seward, AK', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9451600', name:'Sitka, AK', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9452400', name:'Skagway, AK', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9468333', name:'Unalakleet, AK', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9462620', name:'Unalaska, AK', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9454240', name:'Valdez, AK', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9464212', name:'Village Cove, St Paul Island, AK', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9453220', name:'Yakutat, Yakutat Bay, AK', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'2695535', name:'Bermuda, Ferry Reach Channel, Bermuda', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'2695540', name:'Bermuda, St. Georges Island, Bermuda', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9414750', name:'Alameda, CA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9416841', name:'Arena Cove, CA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9414958', name:'Bolinas, Bolinas Lagoon, CA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9414575', name:'Coyote Creek, CA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9419750', name:'Crescent City, CA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9410230', name:'La Jolla, CA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9410660', name:'Los Angeles, CA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9415102', name:'Martinez-Amorco Pier, CA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9413450', name:'Monterey, CA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9418767', name:'North Spit, CA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9411406', name:'Oil Platform Harvest, CA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9415020', name:'Point Reyes, CA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9415144', name:'Port Chicago, CA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9412110', name:'Port San Luis, CA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9414523', name:'Redwood City, CA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9414863', name:'Richmond, CA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9410170', name:'San Diego, CA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9414290', name:'San Francisco, CA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9411340', name:'Santa Barbara, CA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9410840', name:'Santa Monica, CA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9759412', name:'Aguadilla, PR', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9757809', name:'Arecibo, PR', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9761115', name:'Barbuda, Antigua and Barbuda', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9757112', name:'Caja de Muertos, PR', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9751639', name:'Charlotte Amalie, VI', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9751364', name:'Christiansted Harbor, St Croix, VI', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9752235', name:'Culebra, PR', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9752695', name:'Esperanza, Vieques Island, PR', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9753216', name:'Fajardo, PR', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9752619', name:'Isabel Segunda, Vieques Island, PR', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9751381', name:'Lameshur Bay, St John, VI', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9751401', name:'Lime Tree Bay. St. Croix, VI', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9759110', name:'Magueyes Island, PR', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9759394', name:'Mayaguez, PR', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9759938', name:'Mona Island, PR', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9755371', name:'San Juan, La Puntilla, San Juan Bay, PR', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9754228', name:'Yabucoa Harbor, PR', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8467150', name:'Bridgeport, CT', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8465705', name:'New Haven, CT', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8461490', name:'New London, Thames River, CT', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8555889', name:'Brandywine Shoal Light, DE', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8551762', name:'Delaware City, DE', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8557380', name:'Lewes, DE', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8551910', name:'Reedy Point, DE', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8594900', name:'Washington, DC', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8728690', name:'Apalachicola, FL', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8727520', name:'Cedar Key, FL', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8726724', name:'Clearwater Beach, FL', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8720219', name:'Dames Point, FL', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8720030', name:'Fernandina Beach, FL', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8725520', name:'Fort Myers, Caloosahatchee River, FL', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8724580', name:'Key West, FL', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8722670', name:'Lake Worth Pier, Atlantic Ocean, FL', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8720218', name:'Mayport (Bar Pilots Dock), FL', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8726667', name:'Mckay Bay Entrance, FL', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8725110', name:'Naples, Gulf of Mexico, FL', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8726607', name:'Old Port Tampa, FL', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8729210', name:'Panama City Beach, FL', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8729108', name:'Panama City, FL', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8729840', name:'Pensacola, FL', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8726384', name:'Port Manatee, FL', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8720625', name:'Racy Point, St Johns River, FL', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8720226', name:'Southbank Riverwalk, St Johns River, FL', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8726520', name:'St Petersburg, Tampa Bay, FL', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8721604', name:'Trident Pier, Port Canaveral, FL', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8723970', name:'Vaca Key, Florida Bay, FL', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8723214', name:'Virginia Key, Biscayne Bay, FL', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8670870', name:'Fort Pulaski, GA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9044036', name:'Fort Wayne, MI', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9044020', name:'Gibraltar, MI', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9044049', name:'Windmill Point, MI', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9044030', name:'Wyandotte, MI', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9063020', name:'Buffalo, NY', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9063063', name:'Cleveland, OH', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9063038', name:'Erie, PA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9063053', name:'Fairport, OH', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9063090', name:'Fermi Power Plant, MI', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9063079', name:'Marblehead, OH', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9063028', name:'Sturgeon Point, NY', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9063085', name:'Toledo, OH', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9075065', name:'Alpena, MI', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9075099', name:'De Tour Village, MI', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9075035', name:'Essexville, MI', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9075014', name:'Harbor Beach, MI', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9075002', name:'Lakeport, MI', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9075080', name:'Mackinaw City, MI', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9087044', name:'Calumet Harbor, IL', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9087079', name:'Green Bay, WI ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9087031', name:'Holland, MI', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9087068', name:'Kewaunee, WI ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9087023', name:'Ludington, MI ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9087088', name:'Menominee, MI', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9087057', name:'Milwaukee, WI ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9087096', name:'Port Inland, MI ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9087072', name:'Sturgeon Bay Canal, WI', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9052000', name:'Cape Vincent, NY ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9052076', name:'Olcott, NY ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9052030', name:'Oswego, NY', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9052058', name:'Rochester, NY', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9034052', name:'St Clair Shores, MI', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9099064', name:'Duluth, MN ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9099090', name:'Grand Marais, MN ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9099018', name:'Marquette C.G., MI', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9099044', name:'Ontonagon, MI ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9099004', name:'Point Iroquois, MI', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9063009', name:'American Falls, NY ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9063007', name:'Ashland Ave, NY ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9063012', name:'Niagara Intake, NY', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9014070', name:'Algonac, MI ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9014087', name:'Dry Dock, MI ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9014096', name:'Dunn Paper, MI', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9014098', name:'Fort Gratiot, MI ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9014090', name:'Mouth of the Black River, MI ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9014080', name:'St Clair State Police, MI', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8311062', name:'Alexandria Bay, NY ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8311030', name:'Ogdensburg, NY', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9076033', name:'Little Rapids, MI ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9076024', name:'Rock Cut, MI ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9076070', name:'S.W. Pier, MI', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9076060', name:'U.S. Slip, MI ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9076027', name:'West Neebish Island, MI', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'1617760', name:'Hilo, Hilo Bay, Kuhio Bay, HI ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'1612340', name:'Honolulu, HI ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'1615680', name:'Kahului, Kahului Harbor, HI', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'1617433', name:'Kawaihae, HI ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'1612480', name:'Mokuoloe, HI ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'1611400', name:'Nawiliwili, HI', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8764044', name:'Berwick, Atchafalaya River, LA ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8767961', name:'Bulk Terminal, LA ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8768094', name:'Calcasieu Pass, LA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8761955', name:'Carrollton, LA ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8764314', name:'Eugene Island, North of , Gulf of Mexico, LA ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8766072', name:'Freshwater Canal Locks, LA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8761724', name:'Grand Isle, LA ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8762483', name:'I-10 Bonnet Carre Floodway, LA ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8764227', name:'LAWMA, Amerada Pass, LA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8767816', name:'Lake Charles, LA ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8761927', name:'New Canal Station, LA ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8760922', name:'Pilots Station East, SW Pass, LA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8760721', name:'Pilottown, LA ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8762075', name:'Port Fourchon, Belle Pass, LA ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8761305', name:'Shell Beach, LA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8762482', name:'West Bank 1, Bayou Gauche, LA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8413320', name:'Bar Harbor, ME ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8411060', name:'Cutler Farris Wharf, ME ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8410140', name:'Eastport, ME', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8418150', name:'Portland, ME ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8419317', name:'Wells, ME', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8575512', name:'Annapolis, MD ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8574680', name:'Baltimore, MD ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8571421', name:'Bishops Head, MD', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8571892', name:'Cambridge, MD ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8573927', name:'Chesapeake City, MD ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8570283', name:'Ocean City Inlet, MD', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8577330', name:'Solomons Island, MD ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8573364', name:'Tolchester Beach, MD', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8443970', name:'Boston, MA ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8447435', name:'Chatham, Lydia Cove, MA ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8447386', name:'Fall River, MA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8449130', name:'Nantucket Island, MA ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8447930', name:'Woods Hole, MA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8747437', name:'Bay Waveland Yacht Club, MS ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8741041', name:'Dock E, Port of Pascagoula, MS ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8740166', name:'Grand Bay NERR, Mississippi Sound, MS', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8741533', name:'Pascagoula NOAA Lab, MS', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8423898', name:'Fort Point, NH', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8534720', name:'Atlantic City, NJ ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8539094', name:'Burlington, Delaware River, NJ ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8536110', name:'Cape May, NJ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8531680', name:'Sandy Hook, NJ ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8537121', name:'Ship John Shoal, NJ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8519483', name:'Bergen Point West Reach, NY ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8516945', name:'Kings Point, NY ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8510560', name:'Montauk, NY', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8518750', name:'The Battery, NY ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8518962', name:'Turkey Point Hudson River NERRS, NY', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8656483', name:'Beaufort, NC ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8651370', name:'Duck, NC ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8652587', name:'Oregon Inlet Marina, NC', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8654467', name:'USCG Station Hatteras, NC ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8658120', name:'Wilmington, NC ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8658163', name:'Wrightsville Beach, NC', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9439040', name:'Astoria, OR ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9432780', name:'Charleston, OR ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9437540', name:'Garibaldi, OR', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9431647', name:'Port Orford, OR ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9435380', name:'South Beach, OR ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9439201', name:'St Helens, OR', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9439099', name:'Wauna, OR', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'1630000', name:'Apra Harbor, Guam, United States of America', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'1820000', name:'Kwajalein, Marshall Islands, United States of America', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'1631428', name:'Pago Bay, Guam, United States of America', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'1770000', name:'Pago Pago, American Samoa, American Samoa ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'1619910', name:'Sand Island, Midway Islands, United States of America', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'1890000', name:'Wake Island, Pacific Ocean, United States of America', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8546252', name:'Bridesburg, PA ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8540433', name:'Marcus Hook, PA ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8548989', name:'Newbold, PA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8545240', name:'Philadelphia, PA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8452944', name:'Conimicut Light, RI ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8452660', name:'Newport, RI ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8454000', name:'Providence, RI', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8454049', name:'Quonset Point, RI', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8665530', name:'Charleston, Cooper River Entrance, SC ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8662245', name:'Oyster Landing (N Inlet Estuary), SC ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8661070', name:'Springmaid Pier, SC', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8774230', name:'Aransas Wildlife Refuge, San Antonio Bay, TX ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8775241', name:'Aransas, Aransas Pass, TX ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8776604', name:'Baffin Bay, TX', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8775870', name:'Bob Hall Pier, Corpus Christi, TX ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8771013', name:'Eagle Point, TX ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8772447', name:'Freeport, TX', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8771341', name:'Galveston Bay Entrance, North Jetty, TX ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8771450', name:'Galveston Pier 21, TX', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8771486', name:'Galveston Railroad Bridge, TX', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8770808', name:'High Island, TX ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8770733', name:'Lynchburg Landing, TX ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8770777', name:'Manchester, TX', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8773767', name:'Matagorda Bay Entrance Channel, TX, TX ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8773146', name:'Matagorda City, TX ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8770613', name:'Morgans Point, TX', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8775244', name:'Nueces Bay, TX ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8775792', name:'Packery Channel, TX ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8775237', name:'Port Aransas, TX', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8770475', name:'Port Arthur, TX ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8775283', name:'Port Ingleside, TX ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8779770', name:'Port Isabel, TX', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8773259', name:'Port Lavaca, TX ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8778490', name:'Port Mansfield, TX ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8636580', name:'Windmill Point, VA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'8637689', name:'Yorktown USCG Training Center, VA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9440581', name:'Cape Disappointment, WA ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9449424', name:'Cherry Point, WA ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9449880', name:'Friday Harbor, WA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9442396', name:'La Push, WA ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9440422', name:'Longview, WA ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9443090', name:'Neah Bay, WA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9444090', name:'Port Angeles, WA ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9444900', name:'Port Townsend, WA ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9447130', name:'Seattle, WA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9440569', name:'Skamokawa, WA ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9446484', name:'Tacoma, WA ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9440910', name:'Toke Point, WA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9440083', name:'Vancouver, WA ', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'9441102', name:'Westport, WA', 'water_level_endpoint':NOAA_COOPS_WL_ENDPOINT},
  {id:'0204295505', name:'LITTLE NECK CREEK AT PINEWOOD RD AT VA BEACH, VA', 'water_level_endpoint':USGS_WL_ENDPOINT},
  {id:'0204297575', name:'LAKE RUDEE NEAR BELLS ROAD AT VIRGINIA BEACH, VA', 'water_level_endpoint':USGS_WL_ENDPOINT}
];


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

};