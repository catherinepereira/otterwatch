# Otterwatch Backend

The Otterwatch deployment of detstream: watch sea otter cams, detect when an otter is on
screen, and push sightings to a website (via Supabase Realtime) and Discord.

This repo is config and deployment only. The pipeline (sources, detector, debounce, sinks)
is in the detstream package. This repo has the feed config, the database schema for this
deployment, and a Dockerfile. The website is
[otterwatch.vercel.app](https://otterwatch.vercel.app).

## Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt  # installs detstream from PyPI with extras
cp .env.example .env             # then fill in your Supabase keys and Discord webhook
mkdir models
cp ../../otterwatch-model/exports/otter-yolo26s.pt models/
```

The detector is a YOLO26s fine-tuned on frames from these cams in the sibling
[otterwatch-model](../../otterwatch-model) repo. `*.pt` is gitignored, so copy the weights
into `models/` on each machine that runs the worker.

## Run

```bash
python run.py --config otterwatch.yaml
```

`run.py` is `detstream` with this repo's `youtube-snapshot` source registered
(`snapshot_source.py`). Instead of decoding each live stream continuously, it fetches one ~5s
HLS segment per `sample_interval_s` (15s) and detects on its first frame, which cuts bandwidth
by roughly 5x. It also sleeps from sunset until 10 minutes before sunrise (Pacific, the same
reference point as the frontend), and the site shows the cams as resting instead of offline.

The feeds list `sinks: [console, supabase, discord]`. Console needs nothing. The supabase
sink reads `DETSTREAM_SUPABASE_URL` and `DETSTREAM_SUPABASE_KEY` from `.env`, and the discord
sink reads `DETSTREAM_DISCORD_WEBHOOK_URL`. Without those vars the sinks error at startup.
Watch for `sighting on Monterey Bay Aquarium` lines.

### Docker

```bash
docker build -t otterwatch .
docker run --restart unless-stopped --gpus all --env-file .env otterwatch
```

The image bakes in `otterwatch.yaml` and `models/` but not `.env`, so pass the secrets at runtime with
`--env-file`. Without it the supabase and discord sinks error at startup. Drop `--gpus all`
to run CPU-only. The worker pushes out to Supabase/Discord, so there is no inbound port.

### macOS

```bash
cd ~/otterwatch/backend
uv venv venv --seed --python 3.12   # --seed adds pip, which ultralytics uses for auto-installs
uv pip install --python venv/bin/python -r requirements.txt
cp .env.example .env                # then fill it in
mkdir -p models                     # then copy otter-yolo26s.pt in from the training machine
caffeinate -s venv/bin/python run.py --config otterwatch.yaml
```

`caffeinate -s` keeps the Mac awake on power for as long as the worker runs. Closing the lid
still sleeps it.

## Database

This deployment is the source of truth for its Supabase schema in `supabase/migrations/`:
- `0001_init.sql`: `cams` and `sightings`. The detstream supabase sink writes sightings,
  and its `feed_id` maps to the `cam_id` column. Realtime is enabled on `sightings` and the
  frontend subscribes to it. `cams.last_frame_at` is the worker's heartbeat, stamped about
  once a minute while a cam's stream is being read. The frontend shows a cam as offline when
  the stamp is stale.

Apply them through the Supabase SQL editor or CLI, create a `thumbnails` Storage bucket,
then put the project URL + secret key in `.env` (`DETSTREAM_SUPABASE_URL` /
`DETSTREAM_SUPABASE_KEY`). The frontend regenerates its TypeScript types from this live
schema.
