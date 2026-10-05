#!/bin/sh
# The image test (voxelparty-kvalitet §4), calibrated on the approved look C photo K1 (2026-10-05):
# a dusk game, so "light" starts at luminance 80; the HUD's top 12% is left out.
# Floors from that photo: dark ≥ 15%, mid ≥ 10%, light ≥ 10%, top third ≤ 85% black, no bright
# blob over 3%, at most 2 signal colours (falu red and the mint walls).
# Usage: sh qa/bildtest.sh qa/fas1/efter/*.png
exec python3 "$(dirname "$0")/../tools/qa.py" test --ignore-top 0.12 --light 80 "$@"
