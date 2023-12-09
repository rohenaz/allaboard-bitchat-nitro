import React from "react";
import ReactDOM from "react-dom";

import { Provider } from "react-redux";

import { PandaProvider } from "panda-wallet-provider";
import App from "./App";
import { BapProvider } from "./context/bap";
import { BitcoinProvider } from "./context/bitcoin";
import { BmapProvider } from "./context/bmap";
import { HandcashProvider } from "./context/handcash";
import { AutoPandaProvider } from "./context/panda";
import { RelayProvider } from "./context/relay";
import "./index.css";
import store from "./store";

ReactDOM.render(
  <Provider store={store}>
    <PandaProvider>
      <AutoPandaProvider autoconnect={false}>
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
      </AutoPandaProvider>
    </PandaProvider>
  </Provider>,
  document.getElementById("root")
);
