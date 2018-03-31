#!/bin/sh
set -e

# CHANNEL_ID="$(wget "http://www.ustream.tv/channel/live-iss-stream" -q -O - | sed -n 's/.*<meta name="ustream:channel_id" content="\([0-9]*\)".*/\1/p')"
CHANNEL_ID="9408562"

stream_url=$(curl -L "http://iphone-streaming.ustream.tv/uhls/$CHANNEL_ID/streams/live/iphone/playlist.m3u8" | grep -v '#' | head -n 1)

ffmpeg -y -i "$stream_url" -an -f image2 -vframes 1 img.jpg

convert img.jpg -scale 1x1\! -format '%[pixel:s]' info:-

# for f in *.jpg; do echo "$f $(stat -f '%z' "$f") $(convert "$f" -quality 10 - | wc -c | sed 's/ //g')"; done
