defmodule Streamswitcher.Orbit do
  def proxy_astroviewer_data do
    opts = [recv_timeout: 5_000]
    url = "http://astroviewer-sat2a.appspot.com/orbit?var=orbit"
    case HTTPoison.get(url, [], opts) do
      {:ok, %HTTPoison.Response{status_code: status_code, body: body}} -> {status_code, body}
      {:error, %HTTPoison.Error{reason: reason}} -> {500, Poison.encode!(reason)}
    end
  end
end
