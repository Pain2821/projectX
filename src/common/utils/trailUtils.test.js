import { appendUnwrappedTrailPoint, buildTrailSegments } from "./trailUtils";

describe("trail utils", () => {
  it("splits segments when longitude jump is large", () => {
    const points = [
      { latitude: 0, longitude: 10 },
      { latitude: 0, longitude: 20 },
      { latitude: 0, longitude: 100 },
      { latitude: 1, longitude: 101 },
    ];

    const segments = buildTrailSegments(points);

    expect(segments).toEqual([
      [
        [0, 10],
        [0, 20],
      ],
      [
        [0, 100],
        [1, 101],
      ],
    ]);
  });

  it("unwraps dateline crossing and respects max points", () => {
    const start = [{ latitude: 0, longitude: 179 }];
    const next = { latitude: 0.2, longitude: -179 };

    const appended = appendUnwrappedTrailPoint(start, next, 3);

    expect(appended).toEqual([
      { latitude: 0, longitude: 179 },
      { latitude: 0.2, longitude: 181 },
    ]);

    const third = appendUnwrappedTrailPoint(appended, { latitude: 0.3, longitude: -178 }, 2);

    expect(third).toEqual([
      { latitude: 0.2, longitude: 181 },
      { latitude: 0.3, longitude: 182 },
    ]);
  });
});
