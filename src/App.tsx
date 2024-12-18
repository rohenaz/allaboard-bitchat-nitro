import type React from 'react'
import { Routes, Route } from 'react-router-dom'
import { BapProvider } from './context/bap'
import { BitcoinProvider } from './context/bitcoin'
import GlobalStyles from './styles/GlobalStyles'
import LoginPage from './components/authForm/LoginPage'
import SignupPage from './components/authForm/SignupPage'
import Dashboard from './components/dashboard/Dashboard'
import { RequireAuth } from './routes'
import { HandcashProvider } from './context/handcash'
import { BmapProvider } from './context/bmap'
import { YoursProvider } from 'yours-wallet-provider'
import { AutoYoursProvider } from './context/yours'

if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || require('node:buffer').Buffer
}

const App: React.FC = () => {
  return (
    <HandcashProvider>
      <BapProvider>
        <BmapProvider>
        <YoursProvider>
          <AutoYoursProvider autoconnect={true}>
            <BitcoinProvider>
              <GlobalStyles />
              <div className="App">
                <Routes>
                  <Route path="/" element={<LoginPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/channels" element={<Dashboard isFriendsPage={false} />} />
                  <Route
                    path="/friends"
                    element={
                      <RequireAuth>
                        <Dashboard isFriendsPage={true} />
                      </RequireAuth>
                    }
                  />
                  <Route path="/channels/:channel" element={<Dashboard isFriendsPage={false} />} />
                  <Route
                    path="/@/:user"
                    element={
                      <RequireAuth>
                        <Dashboard isFriendsPage={false} />
                      </RequireAuth>
                    }
                  />
                </Routes>
              </div>
            </BitcoinProvider>
          </AutoYoursProvider>
        </YoursProvider>
        </BmapProvider>
      </BapProvider>
    </HandcashProvider>
  )
}

export default App 