import React, { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import router from './routes/index.tsx';
import { GlobalStyles } from './styles/GlobalStyles';

const LoadingSpinner = () => (
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

const App = () => {
  return (
    <ErrorBoundary>
      <GlobalStyles />
      <div className="App">
        <Suspense fallback={<LoadingSpinner />}>
          <RouterProvider router={router} />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
};

export default App;
