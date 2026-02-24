export const API_URLS = {
  iss: "/satellites/25544",
  tledata: "/satellites/25544/tledata",
  tles: "/satellites/25544/tles",
  satelliteById: (id) => `/satellites/${id}`,
};

export default API_URLS;
