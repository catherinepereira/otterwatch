# Runs detstream with this deployment's own sources registered. Same CLI as `detstream`:
#   python run.py --config otterwatch.yaml
import logging
import snapshot_source  # noqa: F401  registers the youtube-snapshot source
from detstream.__main__ import main

if __name__ == "__main__":
    # httpx logs every request at INFO, and each snapshot is a ~1.5KB signed URL. The
    # console sink still logs sightings, and failed requests still surface as warnings
    logging.getLogger("httpx").setLevel(logging.WARNING)
    main()
