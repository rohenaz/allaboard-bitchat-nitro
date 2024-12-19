import type React from 'react';
import { Suspense, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { YoursProvider } from 'yours-wallet-provider';
import ErrorBoundary from './components/ErrorBoundary';
import { BapProvider } from './context/bap';
import { BitcoinProvider } from './context/bitcoin';
import { BmapProvider } from './context/bmap';
import { HandcashProvider } from './context/handcash';
import { AutoYoursProvider } from './context/yours';
import { RequireAuth } from './routes';
import * as LazyComponents from './routes/lazyComponents';
import { GlobalStyles } from './styles/GlobalStyles';

const LoadingSpinner = () => {
  useEffect(() => {
    return () => {};
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        color: 'var(--text-primary)',
      }}
    >
      Loading...
    </div>
  );
};

const RouteDebugger = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  useEffect(() => {}, []);

  return <>{children}</>;
};

if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || require('node:buffer').Buffer;
}

const App = () => {
  useEffect(() => {
    return () => {};
  }, []);

  return (
    <ErrorBoundary>
      <HandcashProvider>
        <BapProvider>
          <BmapProvider>
            <YoursProvider>
              <AutoYoursProvider autoconnect={true}>
                <BitcoinProvider>
                  <GlobalStyles />
                  <div className="App">
                    <RouteDebugger>
                      <Suspense fallback={<LoadingSpinner />}>
                        <Routes>
                          <Route
                            path="/"
                            element={<LazyComponents.LoginPage />}
                          />
                          <Route
                            path="/login"
                            element={<LazyComponents.LoginPage />}
                          />
                          <Route
                            path="/signup"
                            element={<LazyComponents.SignupPage />}
                          />
                          <Route
                            path="/channels"
                            element={
                              <LazyComponents.Dashboard isFriendsPage={false} />
                            }
                          />
                          <Route
                            path="/friends"
                            element={
                              <RequireAuth>
                                <LazyComponents.Dashboard
                                  isFriendsPage={true}
                                />
                              </RequireAuth>
                            }
                          />
                          <Route
                            path="/channels/:channel"
                            element={
                              <LazyComponents.Dashboard isFriendsPage={false} />
                            }
                          />
                          <Route
                            path="/@/:user"
                            element={
                              <RequireAuth>
                                <LazyComponents.Dashboard
                                  isFriendsPage={false}
                                />
                              </RequireAuth>
                            }
                          />
                        </Routes>
                      </Suspense>
                    </RouteDebugger>
                  </div>
                </BitcoinProvider>
              </AutoYoursProvider>
            </YoursProvider>
          </BmapProvider>
        </BapProvider>
      </HandcashProvider>
    </ErrorBoundary>
  );
};

export default App;
