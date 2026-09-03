#!/usr/bin/env bash
# Fills assets/patients/ with one portrait per patient.
#
# Sources are tried in order until one actually returns an image. All of them
# serve faces of people who do not exist (GAN-generated), which is what records
# labelled "synthetic data — not for clinical use" require.
#
#   bash assets/patients/fetch-photos.sh              # all patients
#   bash assets/patients/fetch-photos.sh 2126-0418    # reroll just these
#   bash assets/patients/fetch-photos.sh --probe      # only test the sources
#
set -uo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

SOURCES=(
  'https://thispersondoesnotexist.com/'
  'https://thispersondoesnotexist.com'
  'https://images.generated.photos/random?seed=RANDOM'
  'https://fakeface.rest/face/view?minimum_age=22&maximum_age=60'
)

# A real photo starts with the JPEG (FFD8FF) or PNG (89504E47) magic bytes.
is_image() {
  [ -s "$1" ] || return 1
  local sig; sig=$(head -c 4 "$1" | xxd -p 2>/dev/null | tr 'A-F' 'a-f')
  case "$sig" in ffd8ff*|89504e47) return 0 ;; *) return 1 ;; esac
}

grab() {  # grab <url> <outfile>
  curl -sSL --fail --compressed --max-time 30 \
       -A "$UA" \
       -H 'Accept: image/avif,image/webp,image/jpeg,image/*,*/*;q=0.8' \
       -H 'Accept-Language: en-US,en;q=0.9' \
       -H 'Referer: https://thispersondoesnotexist.com/' \
       -o "$2" "${1//RANDOM/$RANDOM}" 2>/dev/null
}

echo "Probing sources..."
SRC=""
probe="$(mktemp)"
for u in "${SOURCES[@]}"; do
  code=$(curl -s -o "$probe" -w '%{http_code}' -L --max-time 20 -A "$UA" "${u//RANDOM/$RANDOM}" 2>/dev/null)
  if is_image "$probe"; then
    echo "  OK  $u  (HTTP $code, $(wc -c < "$probe") bytes)"
    SRC="$u"; break
  else
    echo "  --  $u  (HTTP $code, $(wc -c < "$probe") bytes, $(file -b --mime-type "$probe" 2>/dev/null))"
    if [ "$(wc -c < "$probe")" -lt 400 ]; then sed -e 's/^/      /' "$probe" | head -3; fi
  fi
done
rm -f "$probe"

if [ -z "$SRC" ]; then
  echo
  echo "No source returned an image from this network - they are almost certainly"
  echo "behind a bot check that plain curl cannot pass."
  echo "Fallback: open https://thispersondoesnotexist.com in your browser, save 15"
  echo "images anywhere, and tell Claude where they are - it will crop, square and"
  echo "rename them to the patient ids for you."
  exit 1
fi
if [ "${1:-}" = "--probe" ]; then exit 0; fi

ALL=(2126-0418 2126-0417 2126-0416 2126-0415 2126-0414 2126-0413 2126-0420
     2126-0410 2126-0421 2126-0422 2126-0423 2126-0424 2126-0425 2126-0426 2126-0427)
IDS=("$@"); if [ ${#IDS[@]} -eq 0 ]; then IDS=("${ALL[@]}"); fi

echo
ok=0; bad=0
for id in "${IDS[@]}"; do
  out="$DIR/$id.jpg"
  if grab "$SRC" "$out" && is_image "$out"; then
    if command -v sips >/dev/null; then sips -Z 400 "$out" >/dev/null 2>&1; fi
    echo "  OK  $id"; ok=$((ok+1))
  else
    echo "  --  $id"; rm -f "$out"; bad=$((bad+1))
  fi
  sleep 1
done

echo
echo "$ok downloaded, $bad failed -> $DIR"
if [ $ok -gt 0 ]; then echo "Reload EVO Connect: the photos replace the drawn avatars everywhere."; fi
