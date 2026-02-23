import BASE_API_URL from "./baseApi";
import API_URLS from "./apiUrls";

export async function fetchIssLocation() {
  const response = await fetch(`${BASE_API_URL}${API_URLS.iss}`);

  if (!response.ok) {
    throw new Error(`ISS API request failed: ${response.status}`);
  }

  return response.json();
}
