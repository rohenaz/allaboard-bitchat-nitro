import React from "react";
import ReactDOM from "react-dom";

import { Provider } from "react-redux";

import { PandaProvider } from "panda-wallet-provider";
import { LoginMode, TokenPassProvider } from "use-tokenpass";
import App from "./App.js";
import { BapProvider } from "./context/bap/index.js";
import { BitcoinProvider } from "./context/bitcoin/index.js";
import { BmapProvider } from "./context/bmap/index.js";
import { HandcashProvider } from "./context/handcash/index.js";
import { AutoPandaProvider } from "./context/panda/index.js";
import { RelayProvider } from "./context/relay/index.js";
import "./index.css";
import store from "./store.js";

const tokenPassConfig = {
  host: "http://localhost:21000",
  loginMode: LoginMode.Manual,
  returnUrl: "https://bitchatnitro.com/channels/nitro",
};

ReactDOM.render(
  <Provider store={store}>
    <PandaProvider>
      <AutoPandaProvider autoconnect={false}>
        <TokenPassProvider options={tokenPassConfig}>
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
        </TokenPassProvider>
      </AutoPandaProvider>
    </PandaProvider>
  </Provider>,
  document.getElementById("root")
);
