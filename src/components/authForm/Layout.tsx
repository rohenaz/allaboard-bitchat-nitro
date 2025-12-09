import type { FC, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface LayoutProps {
	heading: string;
	children: ReactNode;
}

const Layout: FC<LayoutProps> = ({ heading, children }) => {
	return (
		<div className="min-h-screen w-full bg-muted flex items-center justify-center p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center space-y-4">
					<div className="flex justify-center">
						<img
							src="/images/logo-noBgColor.svg"
							alt="BitChat Logo"
							className="w-16 h-16"
						/>
					</div>
					<div className="space-y-2">
						<CardTitle className="text-2xl">Welcome to BitChat</CardTitle>
						<CardDescription>{heading}</CardDescription>
					</div>
				</CardHeader>
				<CardContent>{children}</CardContent>
			</Card>
		</div>
	);
};

export default Layout;
