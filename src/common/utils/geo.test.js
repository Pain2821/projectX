import { easeInOut, normalizeLongitude, shortestLongitudeDelta } from "./geo";

describe("geo utils", () => {
  it("normalizes longitudes into [-180, 180]", () => {
    expect(normalizeLongitude(190)).toBe(-170);
    expect(normalizeLongitude(-190)).toBe(170);
    expect(normalizeLongitude(45)).toBe(45);
  });

  it("returns shortest longitude delta across dateline", () => {
    expect(shortestLongitudeDelta(179, -179)).toBe(2);
    expect(shortestLongitudeDelta(-179, 179)).toBe(-2);
    expect(shortestLongitudeDelta(10, 20)).toBe(10);
  });

  it("uses smooth ease-in-out interpolation", () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(0.5)).toBeCloseTo(0.5, 8);
    expect(easeInOut(1)).toBe(1);
  });
});
