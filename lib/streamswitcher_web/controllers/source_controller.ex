defmodule StreamswitcherWeb.SourceController do
  use StreamswitcherWeb, :controller
  alias Streamswitcher.Sources

  # plug :action

  def index(conn, _params) do
    sources = Sources.list_all
    render conn, sources: sources
  end
end
