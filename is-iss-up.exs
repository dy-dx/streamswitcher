#!/usr/bin/env elixir

defmodule Color do
  @reference %{
    black: [8, 0, 31],
    blue: [2, 4, 222],
    ok: [73, 10, 72]
  }

  @tolerance 30

  def rgbDistance([r1, g1, b1], [r2, g2, b2]) do
    :math.sqrt(:math.pow(r2 - r1, 2) + :math.pow(g2 - g1, 2) + :math.pow(b2 - b1, 2))
  end

  def isBlackOrBlue?(rgb) do
    isBlack = rgbDistance(rgb, @reference.black) < @tolerance
    isBlue = rgbDistance(rgb, @reference.blue) < @tolerance
    isBlack || isBlue
  end
end

source = "http://iphone-streaming.ustream.tv/uhls/9408562/streams/live/iphone/playlist.m3u8"
rgb_cmd = "ffmpeg -y -loglevel 0 -i #{source} -an -f image2 -vframes 1 - " <>
  "| convert - -scale 1x1! -format '%[pixel:s]' info:-"

with {stdout, 0} <- System.cmd("sh", ["-c", rgb_cmd]),
  [r, g, b] <- Regex.scan(~r/\d+/, stdout) |> List.flatten |> Enum.map(&String.to_integer/1),
  false <- Color.isBlackOrBlue?([r, g, b])
do :whatever
else _ -> System.halt(1)
end
