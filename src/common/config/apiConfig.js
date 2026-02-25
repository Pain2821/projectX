export const EXTERNAL_API = {
  spaceNewsBase: "https://api.spaceflightnewsapi.net/v4",
  launchLibraryBase: "https://ll.thespacedevs.com/2.2.0",
  nasaInsightWeather:
    "https://api.nasa.gov/insight_weather/?api_key=DEMO_KEY&feedtype=json&ver=1.0",
  nasaExoplanets:
    "https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=select+top+1500+pl_name,hostname,pl_rade,pl_bmasse,pl_orbper,disc_year,discoverymethod+from+pscomppars+where+pl_rade+is+not+null+and+pl_bmasse+is+not+null+order+by+disc_year+desc&format=json",
  tleIvanBase: "https://tle.ivanstanojevic.me/api/tle/",
};

export default EXTERNAL_API;
