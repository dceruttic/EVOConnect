#!/usr/bin/env bash
# Fills assets/patients/ with one portrait per patient, matched to that
# patient's sex and age band from the registry.
#
# this-person-does-not-exist.com exposes a generator that takes gender and an
# age bracket and answers with JSON pointing at a fresh GAN face. Faces of
# people who do not exist is what records labelled "synthetic data - not for
# clinical use" require. If that endpoint is unavailable the script falls back
# to scraping a random face off thispersondoesnotexist.com (unmatched).
#
#   bash assets/patients/fetch-photos.sh              # all patients
#   bash assets/patients/fetch-photos.sh 2126-0416    # reroll just these
#   bash assets/patients/fetch-photos.sh --probe      # show the raw response
#
set -uo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
GEN='https://this-person-does-not-exist.com'

# id | gender | age bracket   (from DATA.patients: sex + age)
ROSTER=(
  "2126-0418|female|26-35"   # M. Herrera      F 32
  "2126-0417|male|19-25"     # P. Martinez     M 28   (site has no 26-30 band)
  "2126-0416|female|35-50"   # L. Castro       F 41
  "2126-0415|male|26-35"     # A. Duarte       M 36
  "2126-0414|female|26-35"   # S. Ortega       F 29
  "2126-0413|male|26-35"     # R. Vega         M 34
  "2126-0420|all|35-50"      # Mariela Guzman  Other 38
  "2126-0410|male|35-50"     # J. Rivera       M 38
  "2126-0421|male|19-25"     # D. Romero       M 26
  "2126-0422|female|26-35"   # V. Sanz         F 35
  "2126-0423|male|35-50"     # F. Lima         M 41
  "2126-0424|female|26-35"   # N. Perez        F 30
  "2126-0425|female|35-50"   # E. Navarro      F 45
  "2126-0426|male|50"        # T. Aguilar      M 50
  "2126-0427|female|35-50"   # B. Solis        F 36
)

is_image() {
  [ -s "$1" ] || return 1
  local sig; sig=$(head -c 4 "$1" | xxd -p 2>/dev/null | tr 'A-F' 'a-f')
  case "$sig" in ffd8ff*|89504e47) return 0 ;; *) return 1 ;; esac
}
get() { curl -sSL --compressed --max-time 25 -A "$UA" -H 'Accept-Language: en-US,en;q=0.9' "$@"; }

generate() {                              # generate <gender> <age> -> prints image URL
  local g="$1" a="$2" json src
  json="$(get -H "Referer: $GEN/en" -H 'X-Requested-With: XMLHttpRequest' \
          "$GEN/new?time=$(date +%s)$RANDOM&gender=$g&age=$a&etnic=all")" || return 1
  # JSON escapes its slashes (\/img\/x.jpg); a URL never contains a backslash, so strip them
  src="$(printf '%s' "$json" | grep -oE '"(src|image|path)"[[:space:]]*:[[:space:]]*"[^"]+"' | head -1 | sed -E 's/.*"([^"]+)"$/\1/' | tr -d '\\')"
  [ -z "$src" ] && { printf '%s' "$json" >&2; return 1; }
  case "$src" in http*) printf '%s' "$src" ;; /*) printf '%s%s' "$GEN" "$src" ;; *) printf '%s/%s' "$GEN" "$src" ;; esac
}

scrape_any() {                            # last resort: any face, unmatched
  local host='https://thispersondoesnotexist.com' html u
  html="$(get "$host/")" || return 1
  u="$(printf '%s' "$html" | grep -oiE '(src|href|content)="[^"]+\.(jpe?g|png|webp)(\?[^"]*)?"' | head -1 | sed -E 's/^[^"]+"//; s/"$//')"
  [ -z "$u" ] && return 1
  case "$u" in http*) printf '%s' "$u" ;; //*) printf 'https:%s' "$u" ;; /*) printf '%s%s' "$host" "$u" ;; *) printf '%s/%s' "$host" "$u" ;; esac
}

if [ "${1:-}" = "--probe" ]; then
  echo "Asking for a female 35-50 face..."
  url="$(generate female 35-50)" && echo "  image url -> $url" || { echo "  generator did not return a src (raw response above)"; exit 1; }
  tmp="$(mktemp)"; get -H "Referer: $GEN/en" -o "$tmp" "$url" >/dev/null 2>&1
  if is_image "$tmp"; then echo "  OK  $(wc -c < "$tmp") bytes, $(file -b --mime-type "$tmp")"
  else echo "  -- not an image ($(wc -c < "$tmp") bytes)"; fi
  rm -f "$tmp"; exit 0
fi

WANTED=("$@")
ok=0; bad=0; unmatched=0
for row in "${ROSTER[@]}"; do
  IFS='|' read -r id gender age <<< "$row"
  if [ ${#WANTED[@]} -gt 0 ]; then
    hit=0; for w in "${WANTED[@]}"; do [ "$w" = "$id" ] && hit=1; done
    [ $hit -eq 0 ] && continue
  fi
  out="$DIR/$id.jpg"; tag="$gender $age"
  url="$(generate "$gender" "$age" 2>/dev/null)"
  if [ -z "$url" ]; then url="$(scrape_any)"; tag="unmatched"; fi
  if [ -n "$url" ] && get -H "Referer: $GEN/en" -o "$out" "$url" >/dev/null 2>&1 && is_image "$out"; then
    command -v sips >/dev/null && sips -Z 400 "$out" >/dev/null 2>&1
    echo "  OK  $id  ($tag)"; ok=$((ok+1)); [ "$tag" = "unmatched" ] && unmatched=$((unmatched+1))
  else
    echo "  --  $id"; rm -f "$out"; bad=$((bad+1))
  fi
  sleep 1
done

echo
echo "$ok downloaded, $bad failed -> $DIR"
[ $unmatched -gt 0 ] && echo "$unmatched came from the unmatched fallback - rerun those ids."
[ $ok -gt 0 ] && echo "Reload EVO Connect, then tell Claude to eyeball them."
