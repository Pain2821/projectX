import BASE_API_URL from "./baseApi";
import API_URLS from "./apiUrls";

export async function fetchIssLocation() {
  const response = await fetch(`${BASE_API_URL}${API_URLS.iss}`);

  if (!response.ok) {
    throw new Error(`ISS API request failed: ${response.status}`);
  }

  return response.json();
}

export async function fetchIssTleData() {
  const endpoints = [API_URLS.tledata, API_URLS.tles];

  for (const endpoint of endpoints) {
    const response = await fetch(`${BASE_API_URL}${endpoint}`);

    if (response.ok) {
      return response.json();
    }
  }

  throw new Error("Unable to load ISS TLE data.");
}
