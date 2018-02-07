#!/usr/bin/python2.7

"""
Module for retrieving USGS Water Level Stations and formatting it for consumption by Alexa Nav-O.

Example:
    $ python usgs-import.py

Arguments:
    None
"""

import csv
import urllib2
from datetime import date

# URL for the data request
# Retrieved from https://waterdata.usgs.gov/nwis/current?search_criteria=site_tp_cd&submitted_form=introduction:
#   -   Site type: Ocean, Estuary, Stream
#   -   Available Parameters:
#       1   Station Name
#       2   Date and time
#       3   Gage height, ft
#       4   Estuary or ocean water surface elevation above NAVD 1988, ft

USGS_WL_STATION_ENDPOINT = "https://waterdata.usgs.gov/nwis/current?site_tp_cd=OC&site_tp_cd=ES&site_tp_cd=ST&index_pmcode_STATION_NM=1&index_pmcode_DATETIME=2&index_pmcode_00065=3&index_pmcode_62620=4&group_key=NONE&format=sitefile_output&sitefile_output_format=rdb&column_name=agency_cd&column_name=site_no&column_name=station_nm&sort_key_2=site_no&html_table_group_key=NONE&rdb_compression=file&list_of_search_criteria=site_tp_cd%2Crealtime_parameter_selection"
FILE_NAME = str(date.today()) + "_usgs-stations.js"

# Conversion handler


def convertStationToJSON(linein):
    lineout = '{id:"%s", name:"%s", "water_level_endpoint":USGS_WL_ENDPOINT, "water_level_callback":USGS_WL_CALLBACK },\n' % (
        linein[1], linein[2])
    FILE.write(lineout)


# Open file to receive listings
FILE = open(FILE_NAME, "w")

# Retrieve the data from the URL
data = urllib2.urlopen(USGS_WL_STATION_ENDPOINT)

# Process file
tsv = csv.reader(data, delimiter='\t')
for row in tsv:
    if len(row) == 3 and row[0] == 'USGS':
        convertStationToJSON(row)

# Write file
FILE.close()
