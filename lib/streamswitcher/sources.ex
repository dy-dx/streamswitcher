defmodule Streamswitcher.Sources do
  # use Application
  alias Streamswitcher.Sources.ISS

  def list_all do
    [
      %{name: "ISS", type: "application/x-mpegURL", src: ISS.url, is_up: ISS.is_up?},
      # %{name: "Bears", type: "video/youtube", src: "https://www.youtube.com/watch?v=p5mu_febWXg", is_up: true}
      # %{name: "Tropical Reef", type: "video/youtube", src: "https://www.youtube.com/watch?v=1tyxTfhlDmk", is_up: true}
      %{name: "Sharks", type: "video/youtube", src: "https://www.youtube.com/watch?v=4y-puORI7tQ", is_up: true}
    ]
  end
end
