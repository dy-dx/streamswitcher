defmodule Streamswitcher.Sources do
  # use Application
  alias Streamswitcher.Sources.ISS

  def list_all do
    [
      %{name: "ISS", type: "application/x-mpegURL", src: ISS.url, is_up: ISS.is_up?},
      %{name: "Bears", type: "video/youtube", src: "https://www.youtube.com/watch?v=p5mu_febWXg", is_up: true}
    ]
  end
end
