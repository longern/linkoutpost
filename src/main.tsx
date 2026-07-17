import { createRoot } from "react-dom/client";
import { App, type InitialState } from "./App";
import { siteTitle } from "./siteConfig";
import "./features/profile/ProfilePage.css";
import "./styles.css";

declare global {
  interface Window {
    __LINKOUTPOST_INITIAL_STATE__?: InitialState;
  }
}

const rootElement = document.querySelector<HTMLDivElement>("#app");

if (!rootElement) {
  throw new Error("Missing #app root");
}

const initialState =
  window.__LINKOUTPOST_INITIAL_STATE__ ??
  ({
    pathname: window.location.pathname,
    profile: null,
    session: {
      authProviders: {
        google: false,
        shopify: false,
        twitter: false,
      },
      authenticated: false,
      name: null,
      provider: null,
      storage: "offline",
    },
    siteTitle,
  } satisfies InitialState);

createRoot(rootElement).render(<App initialState={initialState} />);
