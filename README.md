![mapstore-covid-us](https://github.com/geosolutions-it/mapstore-covid-us/workflows/mapstore-covid-us/badge.svg)

# MapStore COVID-19 US Tracking Dashboard

![Map Example](/images/covid-map.png)

Demo Site at:https://www.covidtrackingmap.com/

This is an experimental Dashboard for COVID-19 US Tracking built using [MapStore](https://mapstore.geo-solutions.it/mapstore/#/)

It provides the following capabilities:

* The dashboard updates automatically in a periodic basis an updates the header information
* No database needed. The client interacts directly with a data API, similar to the one provided by the [COVID Tracking project](https://covidtracking.com/api). This enables easy installation in a simple web environment (e.g. no web server needed like Tomcat, etc.) It was installed in an Amazon S3 bucket.
* Latest cumulative data is published on the left panel
* Users can select variables of interest by clicking on the left panel. It updates the visualization on the map.
* The map displays bubble plots located at the centroids of each state, depending on the variables selected by the user.
* The right panel provides selected indicators for all states.
* The user can also view and order the statistics on the right column enabling easy comparison among the states. 
* Hovering over a state shows the latest data for that particular state, as it is shown for New York. 


#

## Development setup
Start the development application locally:

- `npm install`
- `npm start`

The application runs at `http://localhost:8090` afterwards.

## Create new client build

Run the build command:

- `npm run build`

Afterward the new compiled client is located in the `build/` directory

## Libraries used:

- `node v12.14.1`
- `npm 6.13.4`
