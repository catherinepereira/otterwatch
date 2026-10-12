# CUDA base: torch/ultralytics use the GPU when one is visible (`--gpus all`) and fall
# back to CPU otherwise, so the same image runs on the home 4070 or a CPU-only box
FROM nvidia/cuda:12.4.1-runtime-ubuntu22.04

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip git ffmpeg libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install --no-cache-dir --upgrade pip
RUN pip3 install --no-cache-dir "detstream[yolo,youtube,supabase]~=0.2.0"

WORKDIR /run
COPY otterwatch.yaml /run/otterwatch.yaml

# Pushes out to Supabase/Discord, so there is no inbound port to expose.
CMD ["python3", "-m", "detstream", "--config", "/run/otterwatch.yaml"]
