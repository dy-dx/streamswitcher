defmodule StreamswitcherWeb.SourceView do
  use StreamswitcherWeb, :view

  def render("index.json", %{sources: sources}) do
    sources
  end
end
