import React from "react";
import ReactDOM from "react-dom";

import { Provider } from "react-redux";

import App from "./App";
import { BapProvider } from "./context/bap";
import { BitcoinProvider } from "./context/bitcoin";
import { BmapProvider } from "./context/bmap";
import { HandcashProvider } from "./context/handcash";
import { RelayProvider } from "./context/relay";
import "./index.css";
import store from "./store";

ReactDOM.render(
  <Provider store={store}>
    <RelayProvider>
      <HandcashProvider>
        <BmapProvider>
          <BapProvider>
            <BitcoinProvider>
              <App />
            </BitcoinProvider>
          </BapProvider>
        </BmapProvider>
      </HandcashProvider>
    </RelayProvider>
  </Provider>,
  document.getElementById("root")
);
