export function shortestLongitudeDelta(fromLongitude, toLongitude) {
  let delta = toLongitude - fromLongitude;

  if (delta > 180) {
    delta -= 360;
  } else if (delta < -180) {
    delta += 360;
  }

  return delta;
}

export function normalizeLongitude(longitude) {
  let value = longitude;

  while (value > 180) {
    value -= 360;
  }
  while (value < -180) {
    value += 360;
  }

  return value;
}

export function easeInOut(progress) {
  if (progress < 0.5) {
    return 2 * progress * progress;
  }

  return 1 - Math.pow(-2 * progress + 2, 2) / 2;
}
