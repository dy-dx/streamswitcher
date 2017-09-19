defmodule Streamswitcher.Sources.ISS do
  use GenServer

  @reference %{
    black: [8, 0, 31],
    blue: [2, 4, 222],
    blue2: [0, 6, 246],
    dark: [49, 0, 66],
    ok: [73, 10, 72]
  }

  @tolerance 20

  def url do
    "https://iphone-streaming.ustream.tv/uhls/9408562/streams/live/iphone/playlist.m3u8"
  end

  def rgbDistance([r1, g1, b1], [r2, g2, b2]) do
    :math.sqrt(:math.pow(r2 - r1, 2) + :math.pow(g2 - g1, 2) + :math.pow(b2 - b1, 2))
  end

  def isColorValid?(rgb) do
    rgbDistance(rgb, @reference.black) < @tolerance
      || rgbDistance(rgb, @reference.blue) < @tolerance
      || rgbDistance(rgb, @reference.blue2) < @tolerance
      || rgbDistance(rgb, @reference.dark) < @tolerance
  end

  def isLive? do
    rgb_cmd = "ffmpeg -y -loglevel 0 -i #{url()} -an -f image2 -vframes 1 - " <>
      "| convert - -scale 1x1! -format '%[pixel:s]' info:-"

    with {stdout, 0} <- System.cmd("sh", ["-c", rgb_cmd]),
      [r, g, b] <- Regex.scan(~r/\d+/, stdout) |> List.flatten |> Enum.map(&String.to_integer/1),
      false <- isColorValid?([r, g, b])
    do true
    else _ -> false
    end
  end

  def status do
    GenServer.call(__MODULE__, :status)
  end

  def start_link do
    GenServer.start_link(__MODULE__, %{}, name: __MODULE__)
  end

  def init(_state) do
    schedule_work() # Schedule work to be performed at some point
    # {:ok, state}
    {:ok, %{status: false}}
  end

  def handle_info(:work, state) do
    is_up = isLive?() # Do work
    schedule_work() # Reschedule once more
    {:noreply, %{state | status: is_up}}
  end

  def handle_call(:status, _from, state) do
    {:reply, state.status, state}
  end

  defp schedule_work() do
    Process.send_after(self(), :work, 10 * 1000) # In 10 seconds
  end
end
