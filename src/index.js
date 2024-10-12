import React from "react";
import ReactDOM from "react-dom";

import { Provider } from "react-redux";

import { YoursProvider } from "yours-wallet-provider";
import App from "./App";
import { BapProvider } from "./context/bap";
import { BitcoinProvider } from "./context/bitcoin";
import { BmapProvider } from "./context/bmap";
import { HandcashProvider } from "./context/handcash";
import { AutoPandaProvider } from "./context/panda";
import "./index.css";
import store from "./store";

ReactDOM.render(
  <Provider store={store}>
    <YoursProvider>
      <AutoPandaProvider autoconnect={false}>
        <HandcashProvider>
          <BmapProvider>
            <BapProvider>
              <BitcoinProvider>
                <App />
              </BitcoinProvider>
            </BapProvider>
          </BmapProvider>
        </HandcashProvider>
      </AutoPandaProvider>
    </YoursProvider>
  </Provider>,
  document.getElementById("root")
);
