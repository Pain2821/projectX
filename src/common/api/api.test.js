import { fetchIssLocation, fetchIssTleData, fetchSpaceNewsArticles } from "./api";
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

  it("fetches ISS location from backend", async () => {
    const payload = { latitude: 1, longitude: 2 };
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => payload,
    });

    const result = await fetchIssLocation();

    expect(result).toEqual(payload);
    expect(global.fetch).toHaveBeenCalledWith(`${BASE_API_URL}${API_URLS.iss}`, {});
  });

  it("fetches ISS TLE from backend endpoint", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({
        name: "ISS",
        line1: "1 25544U TEST",
        line2: "2 25544 TEST",
      }),
    });

    const tle = await fetchIssTleData();

    expect(tle).toEqual({
      name: "ISS",
      line1: "1 25544U TEST",
      line2: "2 25544 TEST",
    });
    expect(global.fetch).toHaveBeenCalledWith(`${BASE_API_URL}${API_URLS.issTle}`, {});
  });

  it("fetches paginated news from backend", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [{ id: 1 }],
        count: 1,
        next: null,
        previous: null,
      }),
    });

    const result = await fetchSpaceNewsArticles(20, 0);

    expect(result.count).toBe(1);
    expect(global.fetch).toHaveBeenCalledWith(`${BASE_API_URL}${API_URLS.news(20, 0)}`, {});
  });
});
