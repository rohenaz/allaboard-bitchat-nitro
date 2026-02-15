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
			<div className="min-h-screen bg-background text-foreground">
				<Suspense fallback={<LoadingSpinner />}>
					<RouterProvider router={router} />
				</Suspense>
			</div>
		</ErrorBoundary>
	);
};

export default App;
