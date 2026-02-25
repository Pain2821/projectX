import { shortestLongitudeDelta } from "./geo";

export function buildTrailSegments(points) {
  if (!points || points.length < 2) {
    return [];
  }

  const segments = [];
  let currentSegment = [[points[0].latitude, points[0].longitude]];

  for (let i = 1; i < points.length; i += 1) {
    const previous = points[i - 1];
    const current = points[i];
    const deltaLon = Math.abs(current.longitude - previous.longitude);

    if (deltaLon > 45) {
      if (currentSegment.length > 1) {
        segments.push(currentSegment);
      }
      currentSegment = [[current.latitude, current.longitude]];
      continue;
    }

    currentSegment.push([current.latitude, current.longitude]);
  }

  if (currentSegment.length > 1) {
    segments.push(currentSegment);
  }

  return segments;
}

export function appendUnwrappedTrailPoint(existingPoints, point, maxPoints) {
  if (!existingPoints.length) {
    return [{ latitude: point.latitude, longitude: point.longitude }];
  }

  const lastPoint = existingPoints[existingPoints.length - 1];
  const unwrappedLongitude =
    lastPoint.longitude + shortestLongitudeDelta(lastPoint.longitude, point.longitude);

  return [...existingPoints, { latitude: point.latitude, longitude: unwrappedLongitude }].slice(
    -maxPoints
  );
}
