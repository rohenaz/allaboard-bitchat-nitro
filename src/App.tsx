import { Buffer } from 'buffer';
import { Route, Routes } from 'react-router-dom';
import { YoursProvider } from 'yours-wallet-provider';
import LoginPage from './components/authForm/LoginPage';
import Dashboard from './components/dashboard/Dashboard';
import { AutoYoursProvider } from './context/yours';
import { GlobalStyles } from './styles/GlobalStyles';

if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

function App() {
  return (
    <>
      <GlobalStyles />
      <YoursProvider>
        <AutoYoursProvider autoconnect={false}>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </AutoYoursProvider>
      </YoursProvider>
    </>
  );
}

export default App;
