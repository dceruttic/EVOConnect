#!/usr/bin/env bash
# Fills assets/patients/ with one portrait per patient.
#
# thispersondoesnotexist.com no longer serves the raw JPEG at its root - it
# returns an HTML page that embeds the image. So: fetch the page, pull the
# image URL out of it, download that. Every reload is a new GAN face of a
# person who does not exist, which is what records labelled "synthetic data -
# not for clinical use" require.
#
#   bash assets/patients/fetch-photos.sh              # all patients
#   bash assets/patients/fetch-photos.sh 2126-0418    # reroll just these
#   bash assets/patients/fetch-photos.sh --probe      # test only, show details
#
set -uo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
PAGES=( 'https://thispersondoesnotexist.com/' 'https://this-person-does-not-exist.com/en' )

is_image() {
  [ -s "$1" ] || return 1
  local sig; sig=$(head -c 4 "$1" | xxd -p 2>/dev/null | tr 'A-F' 'a-f')
  case "$sig" in ffd8ff*|89504e47|52494646) return 0 ;; *) return 1 ;; esac
}

get() { curl -sSL --compressed --max-time 25 -A "$UA" -H 'Accept-Language: en-US,en;q=0.9' "$@"; }

# Print the first image URL found in an HTML page, absolute.
image_url_from() {                       # image_url_from <page-url>
  local page="$1" base host html u
  host="$(printf '%s' "$page" | sed -E 's#^(https?://[^/]+).*#\1#')"
  html="$(get "$page")" || return 1
  u="$(printf '%s' "$html" \
      | grep -oiE '(src|href|content)="[^"]+\.(jpe?g|png|webp)(\?[^"]*)?"' \
      | head -1 | sed -E 's/^[^"]+"//; s/"$//')"
  [ -z "$u" ] && return 1
  case "$u" in
    http*)  printf '%s' "$u" ;;
    //*)    printf 'https:%s' "$u" ;;
    /*)     printf '%s%s' "$host" "$u" ;;
    *)      printf '%s/%s' "$host" "$u" ;;
  esac
}

fetch_one() {                            # fetch_one <outfile>
  local out="$1" page u
  for page in "${PAGES[@]}"; do
    u="$(image_url_from "$page")" || continue
    [ -z "$u" ] && continue
    get -H "Referer: $page" -o "$out" "$u" >/dev/null 2>&1
    if is_image "$out"; then return 0; fi
  done
  rm -f "$out"; return 1
}

if [ "${1:-}" = "--probe" ]; then
  echo "Probing..."
  for page in "${PAGES[@]}"; do
    u="$(image_url_from "$page" || true)"
    if [ -n "$u" ]; then
      echo "  page $page"
      echo "    image url -> $u"
      tmp="$(mktemp)"; get -H "Referer: $page" -o "$tmp" "$u" >/dev/null 2>&1
      if is_image "$tmp"; then echo "    OK  $(wc -c < "$tmp") bytes, $(file -b --mime-type "$tmp")"
      else echo "    -- not an image ($(wc -c < "$tmp") bytes, $(file -b --mime-type "$tmp"))"; fi
      rm -f "$tmp"
    else
      echo "  page $page"
      echo "    no image url found. First lines of the page:"
      get "$page" | head -20 | sed -e 's/^/      /'
    fi
  done
  exit 0
fi

ALL=(2126-0418 2126-0417 2126-0416 2126-0415 2126-0414 2126-0413 2126-0420
     2126-0410 2126-0421 2126-0422 2126-0423 2126-0424 2126-0425 2126-0426 2126-0427)
IDS=("$@"); if [ ${#IDS[@]} -eq 0 ]; then IDS=("${ALL[@]}"); fi

ok=0; bad=0
for id in "${IDS[@]}"; do
  out="$DIR/$id.jpg"
  if fetch_one "$out"; then
    if command -v sips >/dev/null; then sips -Z 400 "$out" >/dev/null 2>&1; fi
    echo "  OK  $id"; ok=$((ok+1))
  else
    echo "  --  $id"; bad=$((bad+1))
  fi
  sleep 1
done

echo
echo "$ok downloaded, $bad failed -> $DIR"
if [ $ok -gt 0 ]; then echo "Reload EVO Connect: the photos replace the drawn avatars everywhere."; fi
if [ $bad -gt 0 ]; then echo "Run with --probe to see what the pages returned."; fi
