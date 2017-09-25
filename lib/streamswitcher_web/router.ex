defmodule StreamswitcherWeb.Router do
  use StreamswitcherWeb, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_flash
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/", StreamswitcherWeb do
    pipe_through :browser # Use the default browser stack

    get "/", PageController, :index
  end

  # Other scopes may use custom stacks.
  scope "/api", StreamswitcherWeb do
    pipe_through :api

    resources "/sources", SourceController
    scope "/orbit" do
      get "/proxy_astroviewer_data", OrbitController, :proxy_astroviewer_data
    end
  end
end
