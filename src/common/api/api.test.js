import { fetchIssLocation, fetchIssTleData } from "./api";
import BASE_API_URL from "./baseApi";
import { API_URLS } from "./apiUrls";

describe("api layer", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it("fetches ISS location from configured endpoint", async () => {
    const payload = { latitude: 1, longitude: 2 };
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => payload,
    });

    const result = await fetchIssLocation();

    expect(result).toEqual(payload);
    expect(global.fetch).toHaveBeenCalledWith(`${BASE_API_URL}${API_URLS.iss}`);
  });

  it("falls back from tledata to tles endpoint", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "application/json" },
        json: async () => ({
          name: "iss",
          line1: "1 25544U TEST",
          line2: "2 25544 TEST",
        }),
      });

    const tle = await fetchIssTleData();

    expect(tle).toEqual({
      name: "iss",
      line1: "1 25544U TEST",
      line2: "2 25544 TEST",
    });
    expect(global.fetch).toHaveBeenNthCalledWith(1, `${BASE_API_URL}${API_URLS.tledata}`);
    expect(global.fetch).toHaveBeenNthCalledWith(2, `${BASE_API_URL}${API_URLS.tles}`);
  });
});
