import React from 'react';
import { createRoot } from 'react-dom/client';

import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import { YoursProvider } from 'yours-wallet-provider';
import App from './App';
import { BapProvider } from './context/bap';
import { BitcoinProvider } from './context/bitcoin';
import { BmapProvider } from './context/bmap';
import { HandcashProvider } from './context/handcash';
import { AutoYoursProvider } from './context/yours';
import './index.css';
import store from './store';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <YoursProvider>
          <AutoYoursProvider autoconnect={false}>
            <HandcashProvider>
              <BmapProvider>
                <BapProvider>
                  <BitcoinProvider>
                    <App />
                  </BitcoinProvider>
                </BapProvider>
              </BmapProvider>
            </HandcashProvider>
          </AutoYoursProvider>
        </YoursProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);
