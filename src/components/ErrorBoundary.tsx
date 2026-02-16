import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
	children?: ReactNode;
}

interface State {
	hasError: boolean;
	error?: Error;
	errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
	public state: State = {
		hasError: false,
	};

	public static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		this.setState({ error, errorInfo });
		console.error('Uncaught error:', error, errorInfo);
	}

	public render() {
		if (this.state.hasError) {
			return (
				<div className="min-h-screen bg-background text-foreground p-8 flex items-center justify-center">
					<div className="max-w-2xl w-full text-center">
						<h1 className="text-destructive text-4xl font-bold mb-6">Sorry.. there was an error</h1>

						<Card className="mb-6">
							<CardContent className="p-4">
								<pre className="whitespace-pre-wrap text-muted-foreground text-sm overflow-x-auto text-left">
									{this.state.error?.toString()}
								</pre>
							</CardContent>
						</Card>

						<div className="flex gap-4 justify-center flex-wrap">
							<Button
								variant="default"
								onClick={() => window.location.reload()}
								className="min-w-[120px]"
							>
								Reload Page
							</Button>
							<Button
								variant="outline"
								onClick={() => window.history.back()}
								className="min-w-[120px]"
							>
								Go Back
							</Button>
						</div>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

export default ErrorBoundary;
