from __future__ import annotations
import asyncio
import datetime
import logging
import os
import re
import tempfile
import time
from collections.abc import AsyncIterator
from zoneinfo import ZoneInfo
import cv2
import httpx
import numpy as np
from astral import Observer
from astral.sun import sun
from detstream.sources import sources
from detstream.sources.youtube import resolve_stream

log = logging.getLogger(__name__)

# The built-in youtube source decodes the whole live stream to keep the newest frame, about
# 1.3 Mbps per feed even though detection only samples it. This source fetches one ~5s HLS
# segment per sample instead and decodes its first frame, so bandwidth scales with the
# sample interval rather than the stream bitrate

# The cams are all on the US/Canada west coast. Same reference point as the frontend's
# utils/dayNight.ts, so the worker sleeps exactly when the site says the otters are resting
PORTLAND = Observer(latitude=45.5152, longitude=-122.6784)
PACIFIC = ZoneInfo("America/Los_Angeles")
# Wake this long before sunrise so every cam has a fresh heartbeat by the time the site
# flips to day and starts showing stale cams as offline
WAKE_BEFORE_SUNRISE = datetime.timedelta(minutes=10)

# The media playlist holds an hour of DVR segment URLs (~900KB), so it is fetched only on
# resolve. Between resolves the live-edge segment number is extrapolated from the clock
RESOLVE_EVERY_S = 30 * 60
RETRY_BACKOFF_S = (5.0, 15.0, 30.0, 60.0)
_SQ = re.compile(r"/sq/(\d+)/")


def _sun_times(day: datetime.date) -> tuple[datetime.datetime, datetime.datetime]:
    times = sun(PORTLAND, date=day, tzinfo=PACIFIC)
    return times["sunrise"], times["sunset"]


# Seconds until the worker should be awake again, or 0 if it should be awake now
def seconds_until_wake(now: datetime.datetime | None = None) -> float:
    now = now or datetime.datetime.now(PACIFIC)
    sunrise, sunset = _sun_times(now.date())
    wake = sunrise - WAKE_BEFORE_SUNRISE
    if wake <= now < sunset:
        return 0.0
    if now >= sunset:
        wake = _sun_times(now.date() + datetime.timedelta(days=1))[0] - WAKE_BEFORE_SUNRISE
    return (wake - now).total_seconds()


class _LiveEdge:
    """Tracks the newest segment of one stream's HLS media playlist."""

    def __init__(self, youtube_url: str, max_height: int):
        self.youtube_url = youtube_url
        self.max_height = max_height
        self.template = ""
        self.base_sq = 0
        self.base_t = 0.0
        self.duration = 5.0

    async def resolve(self, client: httpx.AsyncClient) -> None:
        hls = await asyncio.to_thread(resolve_stream, self.youtube_url, self.max_height)
        r = await client.get(hls)
        r.raise_for_status()
        lines = r.text.splitlines()
        segments = [line for line in lines if line and not line.startswith("#")]
        if not segments or not _SQ.search(segments[-1]):
            raise RuntimeError("playlist has no numbered segments")
        durations = [float(line[8:].rstrip(",")) for line in lines if line.startswith("#EXTINF:")]
        self.template = segments[-1]
        self.base_sq = int(_SQ.search(self.template).group(1))
        self.base_t = time.monotonic()
        self.duration = durations[-1] if durations else 5.0

    def stale(self) -> bool:
        return not self.template or time.monotonic() - self.base_t > RESOLVE_EVERY_S

    def current_url(self) -> str:
        sq = self.base_sq + int((time.monotonic() - self.base_t) / self.duration)
        return _SQ.sub(f"/sq/{sq}/", self.template)


def _first_frame(data: bytes) -> np.ndarray | None:
    fd, path = tempfile.mkstemp(suffix=".ts")
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(data)
        cap = cv2.VideoCapture(path)
        try:
            ok, frame = cap.read()
        finally:
            cap.release()
        return frame if ok else None
    finally:
        os.unlink(path)


class YouTubeSnapshotSource:
    def __init__(self, url: str, interval_s: float, max_height: int, sleep_at_night: bool):
        self.url = url
        self.interval_s = interval_s
        self.max_height = max_height
        self.sleep_at_night = sleep_at_night

    async def frames(self) -> AsyncIterator[tuple[float, np.ndarray]]:
        edge = _LiveEdge(self.url, self.max_height)
        failures = 0
        async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
            while True:
                if self.sleep_at_night:
                    wait = seconds_until_wake()
                    if wait > 0:
                        log.info("%s: sleeping %.0f min until sunrise", self.url, wait / 60)
                        # Short chunks so a Mac waking from sleep or a clock change re-checks
                        while (wait := seconds_until_wake()) > 0:
                            await asyncio.sleep(min(wait, 300))
                        # The playlist URL has likely expired overnight
                        edge.template = ""
                        log.info("%s: awake", self.url)

                started = time.monotonic()
                try:
                    if edge.stale():
                        await edge.resolve(client)
                    r = await client.get(edge.current_url())
                    if r.status_code in (403, 404):
                        # Extrapolated past the live edge or the URL expired, so resync
                        await edge.resolve(client)
                        r = await client.get(edge.current_url())
                    r.raise_for_status()
                    frame = await asyncio.to_thread(_first_frame, r.content)
                    if frame is None:
                        raise RuntimeError("segment did not decode")
                except Exception as e:
                    backoff = RETRY_BACKOFF_S[min(failures, len(RETRY_BACKOFF_S) - 1)]
                    failures += 1
                    edge.template = ""
                    log.warning("%s: snapshot failed: %s; retrying in %ss", self.url, e, backoff)
                    await asyncio.sleep(backoff)
                    continue

                failures = 0
                yield time.time(), frame
                await asyncio.sleep(max(0.0, self.interval_s - (time.monotonic() - started)))


@sources.register("youtube-snapshot")
def _build(config: dict) -> YouTubeSnapshotSource:
    return YouTubeSnapshotSource(
        url=config["url"],
        interval_s=config.get("interval_s", 15.0),
        max_height=config.get("max_height", 720),
        sleep_at_night=config.get("sleep_at_night", True),
    )
