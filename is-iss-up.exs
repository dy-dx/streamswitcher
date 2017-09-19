#!/usr/bin/env elixir

defmodule ISS do
  @references_down %{
    black: [8, 0, 31],
    blue: [2, 4, 222],
    blue2: [0, 6, 246],
    dark: [49, 0, 66]
  }

  @references_up %{
    ok: [73, 10, 72],
    ok2: [51, 15, 46]
  }

  @tolerance 20

  @channel_id "9408562"

  def url do
    "https://iphone-streaming.ustream.tv/uhls/#{@channel_id}/streams/live/iphone/playlist.m3u8"
  end

  def rgb_cmd do
    "ffmpeg -y -loglevel 0 -i #{url()} -an -f image2 -vframes 1 - " <>
      "| convert - -scale 1x1! -format '%[pixel:s]' info:-"
  end

  def rgb_distance([r1, g1, b1], [r2, g2, b2]) do
    :math.sqrt(:math.pow(r2 - r1, 2) + :math.pow(g2 - g1, 2) + :math.pow(b2 - b1, 2))
  end

  def within_tolerance?(rgb1, rgb2), do: rgb_distance(rgb1, rgb2) < @tolerance

  def is_color_valid?(rgb) do
    Map.values(@references_down) |> Enum.any?(&within_tolerance?(rgb, &1))
  end

  def fetch_status do
    with {stdout, 0} <- System.cmd("sh", ["-c", rgb_cmd()], stderr_to_stdout: true),
      [r, g, b] <- Regex.scan(~r/\d+/, stdout) |> List.flatten |> Enum.map(&String.to_integer/1),
      false <- is_color_valid?([r, g, b])
    do :up
    else
      {_stdout, _code} -> :offline
      _ -> :dark
    end
  end
end

case ISS.fetch_status() do
  :offline -> System.halt(1)
  :dark -> System.halt(1)
  :up -> :sweet
end
