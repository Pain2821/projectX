import {
  ecfToLookAngles,
  eciToEcf,
  gstime,
  propagate,
  twoline2satrec,
} from "satellite.js";

const STEP_SECONDS = 20;
const SEARCH_HOURS = 48;
const MIN_ELEVATION_DEGREES = 10;

function degToRad(value) {
  return (value * Math.PI) / 180;
}

function radToDeg(value) {
  return (value * 180) / Math.PI;
}

function getObserverGd(latitude, longitude, heightMeters = 0) {
  return {
    latitude: degToRad(latitude),
    longitude: degToRad(longitude),
    height: heightMeters / 1000,
  };
}

function elevationAt(date, satrec, observerGd) {
  const propagated = propagate(satrec, date);

  if (!propagated.position) {
    return null;
  }

  const gmst = gstime(date);
  const positionEcf = eciToEcf(propagated.position, gmst);
  const lookAngles = ecfToLookAngles(observerGd, positionEcf);

  return lookAngles.elevation;
}

function refineThresholdCrossing(startDate, endDate, satrec, observerGd, thresholdRad) {
  let low = startDate.getTime();
  let high = endDate.getTime();

  for (let i = 0; i < 18; i += 1) {
    const mid = Math.floor((low + high) / 2);
    const midElevation = elevationAt(new Date(mid), satrec, observerGd);

    if (midElevation === null) {
      low = mid;
      continue;
    }

    if (midElevation >= thresholdRad) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return new Date(high);
}

function refinePassEnd(startDate, endDate, satrec, observerGd, thresholdRad) {
  let low = startDate.getTime();
  let high = endDate.getTime();

  for (let i = 0; i < 18; i += 1) {
    const mid = Math.floor((low + high) / 2);
    const midElevation = elevationAt(new Date(mid), satrec, observerGd);

    if (midElevation === null) {
      high = mid;
      continue;
    }

    if (midElevation >= thresholdRad) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return new Date(high);
}

function findMaxElevation(startDate, endDate, satrec, observerGd) {
  let bestElevation = -Infinity;
  let bestTime = startDate;

  for (let t = startDate.getTime(); t <= endDate.getTime(); t += 2000) {
    const currentDate = new Date(t);
    const elevation = elevationAt(currentDate, satrec, observerGd);

    if (elevation !== null && elevation > bestElevation) {
      bestElevation = elevation;
      bestTime = currentDate;
    }
  }

  return {
    maxElevationDeg: radToDeg(bestElevation),
    maxElevationTime: bestTime,
  };
}

export function calculateNextIssPass({ line1, line2, latitude, longitude, heightMeters = 0 }) {
  if (!line1 || !line2) {
    throw new Error("Invalid TLE data.");
  }

  const satrec = twoline2satrec(line1, line2);
  const observerGd = getObserverGd(latitude, longitude, heightMeters);
  const thresholdRad = degToRad(MIN_ELEVATION_DEGREES);

  const startTime = Date.now();
  const endTime = startTime + SEARCH_HOURS * 60 * 60 * 1000;
  const stepMs = STEP_SECONDS * 1000;

  let prevDate = new Date(startTime);
  let prevElevation = elevationAt(prevDate, satrec, observerGd);
  let inPass = prevElevation !== null && prevElevation >= thresholdRad;
  let passStart = inPass ? prevDate : null;

  for (let t = startTime + stepMs; t <= endTime; t += stepMs) {
    const currentDate = new Date(t);
    const currentElevation = elevationAt(currentDate, satrec, observerGd);

    if (currentElevation === null || prevElevation === null) {
      prevDate = currentDate;
      prevElevation = currentElevation;
      continue;
    }

    if (!inPass && prevElevation < thresholdRad && currentElevation >= thresholdRad) {
      passStart = refineThresholdCrossing(prevDate, currentDate, satrec, observerGd, thresholdRad);
      inPass = true;
    }

    if (inPass && prevElevation >= thresholdRad && currentElevation < thresholdRad) {
      const passEnd = refinePassEnd(prevDate, currentDate, satrec, observerGd, thresholdRad);
      const { maxElevationDeg, maxElevationTime } = findMaxElevation(
        passStart,
        passEnd,
        satrec,
        observerGd
      );

      const durationMinutes = Math.max(
        1,
        Math.round((passEnd.getTime() - passStart.getTime()) / 60000)
      );

      return {
        startTime: passStart,
        endTime: passEnd,
        durationMinutes,
        maxElevationDeg,
        maxElevationTime,
      };
    }

    prevDate = currentDate;
    prevElevation = currentElevation;
  }

  throw new Error("No visible ISS pass found in the next 48 hours for your location.");
}

export function formatPassSummary(passResult) {
  const dateText = passResult.startTime.toLocaleDateString();
  const timeText = passResult.startTime.toLocaleTimeString();
  const maxElevationText = Math.max(0, passResult.maxElevationDeg).toFixed(0);

  return `ISS will pass over your location on ${dateText} at ${timeText}, visible for approximately ${passResult.durationMinutes} minutes at max elevation ${maxElevationText} degrees`;
}

