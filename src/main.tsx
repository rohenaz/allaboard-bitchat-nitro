import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { YoursProvider } from 'yours-wallet-provider';
import App from './App';
import { BapProvider } from './context/bap';
import { BitcoinProvider } from './context/bitcoin';
import { BmapProvider } from './context/bmap';
import { HandcashProvider } from './context/handcash';
import { AutoYoursProvider } from './context/yours';
import './index.css';
import store from './store';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

const root = createRoot(rootElement);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <YoursProvider>
        <AutoYoursProvider autoconnect={true}>
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
    </Provider>
  </React.StrictMode>,
);
