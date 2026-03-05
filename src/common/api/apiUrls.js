export const API_URLS = {
  iss: "/api/iss",
  issTle: "/api/iss/tle",
  satelliteById: (id) => `/api/satellites/${id}`,
  celestrakTle: (id, name = "ISS") => `/api/tle/celestrak/${id}?name=${encodeURIComponent(name)}`,
  news: (limit, offset) => `/api/news?limit=${limit}&offset=${offset}`,
  launches: (limit, offset) => `/api/launches?limit=${limit}&offset=${offset}`,
  marsWeather: "/api/mars-weather",
  exoplanets: "/api/exoplanets",
  tleIvan: (page, pageSize) => `/api/tle-ivan?page=${page}&pageSize=${pageSize}`,
};

export default API_URLS;
