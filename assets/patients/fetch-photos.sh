#!/usr/bin/env bash
# Fills assets/patients/ with one portrait per patient.
#
# Source: thispersondoesnotexist.com — StyleGAN faces of people who do not
# exist. No consent, licensing or privacy problem, which is what we need for
# records labelled "synthetic data — not for clinical use".
#
# Run it from anywhere:   bash assets/patients/fetch-photos.sh
# Re-run it to reroll every face; pass ids to reroll only those:
#                         bash assets/patients/fetch-photos.sh 2126-0418 2126-0417

set -uo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

ALL=(2126-0418 2126-0417 2126-0416 2126-0415 2126-0414 2126-0413 2126-0420
     2126-0410 2126-0421 2126-0422 2126-0423 2126-0424 2126-0425 2126-0426 2126-0427)

IDS=("$@"); [ ${#IDS[@]} -eq 0 ] && IDS=("${ALL[@]}")

ok=0; bad=0
for id in "${IDS[@]}"; do
  out="$DIR/$id.jpg"
  curl -sSL --fail --max-time 30 \
       -A 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' \
       -o "$out" 'https://thispersondoesnotexist.com' || { echo "  ✗ $id (download failed)"; bad=$((bad+1)); continue; }
  # a truncated or HTML error page is not a photo
  if [ ! -s "$out" ] || [ "$(wc -c < "$out")" -lt 20000 ]; then
    echo "  ✗ $id (not an image)"; rm -f "$out"; bad=$((bad+1)); continue
  fi
  command -v sips >/dev/null && sips -Z 400 "$out" >/dev/null 2>&1   # square-ish 400px, macOS built-in
  echo "  ✓ $id"; ok=$((ok+1))
  sleep 1                                                            # be polite to the source
done

echo
echo "$ok downloaded, $bad failed → $DIR"
echo "Reload EVO Connect: the photos replace the drawn avatars everywhere."
