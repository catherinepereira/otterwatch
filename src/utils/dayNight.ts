import SunCalc from "suncalc";

// The otter cams are all on the US/Canada west coast, so a single reference point
// (Portland, OR) gives a close-enough sunrise/sunset for the whole set. SunCalc works in
// absolute UTC time, so the viewer's own timezone does not matter.
const PORTLAND_LAT = 45.5152;
const PORTLAND_LON = -122.6784;

export function isDayInPacific(now: Date = new Date()): boolean {
  const { sunrise, sunset } = SunCalc.getTimes(now, PORTLAND_LAT, PORTLAND_LON);
  return now >= sunrise && now < sunset;
}
