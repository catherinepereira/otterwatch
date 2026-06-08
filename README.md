# Otterwatch Backend

The Otterwatch deployment of detstream: watch sea otter cams, detect when an otter is on
screen, and push sightings to a website (via Supabase Realtime) and Discord.

This repo is config and deployment only. The pipeline (sources, detector, debounce, sinks)
is in the detstream package. This repo has the feed config, the database schema for this
deployment, and a Dockerfile. The website is
[otterwatch.vercel.app](https://otterwatch.vercel.app).

## Setup

```bash
cd otterwatch-backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt  # installs detstream from PyPI with extras
cp .env.example .env             # then fill in your Supabase keys and Discord webhook
```

## Run

```bash
detstream --config otterwatch.yaml
```

The feeds list `sinks: [console, supabase, discord]`. Console needs nothing. The supabase
sink reads `DETSTREAM_SUPABASE_URL` and `DETSTREAM_SUPABASE_KEY` from `.env`, and the discord
sink reads `DETSTREAM_DISCORD_WEBHOOK_URL`. Without those vars the sinks error at startup.
Watch for `spotted on Monterey Bay Aquarium` lines.

On first run YOLO-World downloads its weights (~26MB), and ultralytics fetches CLIP the
first time the detector runs.

### Docker

```bash
docker build -t otterwatch .
docker run --restart unless-stopped --gpus all --env-file .env otterwatch
```

The image bakes in `otterwatch.yaml` but not `.env`, so pass the secrets at runtime with
`--env-file`. Without it the supabase and discord sinks error at startup. Drop `--gpus all`
to run CPU-only. The worker pushes out to Supabase/Discord, so there is no inbound port.

## Database

This deployment is the source of truth for its Supabase schema in `supabase/migrations/`:
- `0001_init.sql`: `cams` and `sightings`. The detstream supabase sink writes sightings,
  and its `feed_id` maps to the `cam_id` column. Realtime is enabled on `sightings` and the
  frontend subscribes to it.

Apply them through the Supabase SQL editor or CLI, create a `thumbnails` Storage bucket,
then put the project URL + secret key in `.env` (`DETSTREAM_SUPABASE_URL` /
`DETSTREAM_SUPABASE_KEY`). The frontend regenerates its TypeScript types from this live
schema.
