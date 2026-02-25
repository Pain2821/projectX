import React, { useEffect, useMemo, useState } from "react";
import { Polygon, Polyline } from "react-leaflet";
import SunCalc from "suncalc";
import { normalizeLongitude } from "../common/utils";

const SHADOW_UPDATE_INTERVAL_MS = 60000;

function getSunAltitude(date, latitude, longitude) {
  return SunCalc.getPosition(date, latitude, longitude).altitude;
}

function findTerminatorLatitude(date, longitude) {
  let low = -89.999;
  let high = 89.999;
  let lowAltitude = getSunAltitude(date, low, longitude);
  let highAltitude = getSunAltitude(date, high, longitude);

  if (Math.abs(lowAltitude) < 1e-7) {
    return low;
  }

  if (Math.abs(highAltitude) < 1e-7) {
    return high;
  }

  if (lowAltitude * highAltitude > 0) {
    return lowAltitude < 0 ? -89.5 : 89.5;
  }

  for (let i = 0; i < 24; i += 1) {
    const mid = (low + high) / 2;
    const midAltitude = getSunAltitude(date, mid, longitude);

    if (Math.abs(midAltitude) < 1e-7) {
      return mid;
    }

    if (lowAltitude * midAltitude <= 0) {
      high = mid;
      highAltitude = midAltitude;
    } else {
      low = mid;
      lowAltitude = midAltitude;
    }
  }

  return (low + high) / 2;
}

function buildTerminatorLine(date) {
  const points = [];

  for (let longitude = -180; longitude <= 180; longitude += 2) {
    const latitude = findTerminatorLatitude(date, longitude);
    points.push([latitude, longitude]);
  }

  return points;
}

function pointInPolygon(point, polygon) {
  const x = point[1];
  const y = point[0];
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i][1];
    const yi = polygon[i][0];
    const xj = polygon[j][1];
    const yj = polygon[j][0];

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + Number.EPSILON) + xi;

    if (intersect) {
      inside = !inside;
    }
  }

  return inside;
}

function estimateAntiSolarPoint(date) {
  let best = { altitude: -Infinity, latitude: 0, longitude: 0 };

  for (let latitude = -80; latitude <= 80; latitude += 10) {
    for (let longitude = -180; longitude <= 180; longitude += 10) {
      const altitude = getSunAltitude(date, latitude, longitude);
      if (altitude > best.altitude) {
        best = { altitude, latitude, longitude };
      }
    }
  }

  return [-best.latitude, normalizeLongitude(best.longitude + 180)];
}

function buildNightPolygon(terminator, antiSolar) {
  const northCap = [...terminator, [90, 180], [90, -180]];
  const southCap = [...terminator, [-90, 180], [-90, -180]];

  return pointInPolygon(antiSolar, northCap) ? northCap : southCap;
}

function shiftLongitudes(points, shift) {
  return points.map(([latitude, longitude]) => [latitude, longitude + shift]);
}

export default function DayNightOverlay() {
  const [shadowTime, setShadowTime] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setShadowTime(Date.now());
    }, SHADOW_UPDATE_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, []);

  const { wrappedNightPolygons, wrappedTerminatorLines } = useMemo(() => {
    const date = new Date(shadowTime);
    const terminator = buildTerminatorLine(date);
    const antiSolarPoint = estimateAntiSolarPoint(date);
    const nightPolygon = buildNightPolygon(terminator, antiSolarPoint);
    const shifts = [-360, 0, 360];

    return {
      wrappedNightPolygons: shifts.map((shift) => shiftLongitudes(nightPolygon, shift)),
      wrappedTerminatorLines: shifts.map((shift) => shiftLongitudes(terminator, shift)),
    };
  }, [shadowTime]);

  return (
    <>
      {wrappedNightPolygons.map((polygon, index) => (
        <Polygon
          key={`night-${index}`}
          positions={polygon}
          pathOptions={{
            color: "rgba(0,0,20,0)",
            fillColor: "rgb(0, 0, 0)",
            fillOpacity: 0.62,
            opacity: 0,
            weight: 0,
            smoothFactor: 1.4,
          }}
        />
      ))}
      {wrappedTerminatorLines.map((line, index) => (
        <Polyline
          key={`terminator-${index}`}
          positions={line}
          pathOptions={{
            color: "#5a88ff",
            opacity: 0.45,
            weight: 1.4,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      ))}
    </>
  );
}
