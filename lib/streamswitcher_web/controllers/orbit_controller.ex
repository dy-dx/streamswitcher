defmodule StreamswitcherWeb.OrbitController do
  use StreamswitcherWeb, :controller
  alias Streamswitcher.Orbit

  def proxy_astroviewer_data(conn, _params) do
    {code, body} = Orbit.proxy_astroviewer_data()
    send_resp(conn, code, body)
  end
end
