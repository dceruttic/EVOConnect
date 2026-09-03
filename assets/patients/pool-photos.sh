#!/usr/bin/env bash
# Downloads a pool of GAN faces into assets/patients/_pool/ so Claude can look
# at them and assign each one to the patient whose sex and age it fits.
#
# Source: thispersondoesnotexist.com — unwatermarked, but it gives no control
# over who you get, which is exactly why a human (well, Claude) picks.
#
#   bash assets/patients/pool-photos.sh        # 40 faces
#   bash assets/patients/pool-photos.sh 60     # more
#
set -uo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/_pool"
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
HOST='https://thispersondoesnotexist.com'
N="${1:-40}"
mkdir -p "$DIR"

is_image() {
  [ -s "$1" ] || return 1
  local sig; sig=$(head -c 4 "$1" | xxd -p 2>/dev/null | tr 'A-F' 'a-f')
  case "$sig" in ffd8ff*|89504e47) return 0 ;; *) return 1 ;; esac
}
get() { curl -sSL --compressed --max-time 25 -A "$UA" "$@"; }

url="$(get "$HOST/" | grep -oiE '(src|href|content)="[^"]+\.(jpe?g|png|webp)(\?[^"]*)?"' | head -1 | sed -E 's/^[^"]+"//; s/"$//')"
case "$url" in http*) ;; //*) url="https:$url" ;; /*) url="$HOST$url" ;; *) url="$HOST/$url" ;; esac
[ -z "$url" ] && { echo "could not find the image url on $HOST"; exit 1; }
echo "source: $url"
echo

ok=0
for i in $(seq -f '%02g' 1 "$N"); do
  out="$DIR/face-$i.jpg"
  if get -H "Referer: $HOST/" -o "$out" "$url?$RANDOM$RANDOM" >/dev/null 2>&1 && is_image "$out"; then
    command -v sips >/dev/null && sips -Z 400 "$out" >/dev/null 2>&1
    ok=$((ok+1)); printf '.'
  else
    rm -f "$out"; printf 'x'
  fi
  sleep 1
done

echo; echo
echo "$ok faces -> $DIR"
echo "Tell Claude the pool is ready; it will pick one per patient and rename them."
