defmodule Streamswitcher.Sources.ISS do
  use GenServer

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

  def is_up? do
    status() == :up
  end

  def status do
    GenServer.call(__MODULE__, :status)
  end

  def start_link do
    GenServer.start_link(__MODULE__, %{}, name: __MODULE__)
  end

  def init(_state) do
    schedule_work(0)
    {:ok, %{status: :offline}}
  end

  def handle_call(:status, _from, state) do
    {:reply, state.status, state}
  end

  def handle_cast({:update_status, status}, state) do
    {:noreply, %{state | status: status}}
  end

  def handle_info(:work, state) do
    # Do work in another process, which will asynchronously pass results back to us
    spawn fn -> GenServer.cast(__MODULE__, {:update_status, fetch_status()}) end
    schedule_work() # Reschedule once more
    {:noreply, state}
  end

  defp fetch_status do
    with {stdout, 0} <- System.cmd("sh", ["-c", rgb_cmd()], stderr_to_stdout: true),
      [r, g, b] <- Regex.scan(~r/\d+/, stdout) |> List.flatten |> Enum.map(&String.to_integer/1),
      false <- is_color_valid?([r, g, b])
    do :up
    else
      {_stdout, _code} -> :offline
      _ -> :dark
    end
  end

  defp schedule_work(delay \\ 10_000) do
    Process.send_after(self(), :work, delay)
  end
end
