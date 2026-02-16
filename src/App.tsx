import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import router from './routes/index.tsx';

const LoadingSpinner = () => (
	<div className="flex justify-center items-center h-screen text-foreground">Loading...</div>
);

const App = () => {
	return (
		<ErrorBoundary>
			<Suspense fallback={<LoadingSpinner />}>
				<RouterProvider router={router} />
			</Suspense>
		</ErrorBoundary>
	);
};

export default App;
