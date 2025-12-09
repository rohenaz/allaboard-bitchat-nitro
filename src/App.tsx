import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import router from './routes/index.tsx';
import { GlobalStyles } from './styles/GlobalStyles';

const LoadingSpinner = () => (
	<div className="flex justify-center items-center h-screen text-base-content">Loading...</div>
);

const App = () => {
	return (
		<ErrorBoundary>
			<GlobalStyles />
			<div className="min-h-screen bg-base-100 text-base-content">
				<Suspense fallback={<LoadingSpinner />}>
					<RouterProvider router={router} />
				</Suspense>
			</div>
		</ErrorBoundary>
	);
};

export default App;
