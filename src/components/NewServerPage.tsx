import { ArrowLeft } from 'lucide-react';
import type { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

export const NewServerPage: FC = () => {
	const navigate = useNavigate();

	const handleBack = () => {
		navigate('/channels');
	};

	return (
		<div className="flex flex-col h-screen bg-background overflow-hidden">
			<header className="flex items-center gap-4 p-4 px-6 bg-card border-b shadow-sm">
				<Button variant="outline" size="sm" onClick={handleBack} className="gap-2">
					<ArrowLeft className="h-4 w-4" />
					Back
				</Button>
				<div className="flex items-center gap-3 flex-1">
					<h1 className="text-xl font-semibold text-foreground">Submit a Server</h1>
				</div>
			</header>

			<main className="flex-1 overflow-y-auto p-6 flex justify-center items-start pt-20">
				<div className="w-full max-w-[600px]">
					<div className="inline-flex items-center gap-2 px-3 py-1.5 bg-card border rounded-full text-[13px] text-muted-foreground mb-6">
						<span>🚀</span>
						<span>Server submissions opening soon - stay tuned</span>
					</div>

					<Card>
						<CardHeader>
							<CardTitle>Server Submission Form</CardTitle>
							<CardDescription>
								Submit your server to be featured in BitChat Nitro. Once approved, users will be
								able to discover and join your community.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="server-name">Server Name</Label>
								<Input id="server-name" type="text" placeholder="My Awesome Server" disabled />
							</div>

							<div className="space-y-2">
								<Label htmlFor="server-email">Contact Email</Label>
								<Input id="server-email" type="email" placeholder="admin@example.com" disabled />
							</div>

							<div className="space-y-2">
								<Label htmlFor="server-url">Server URL</Label>
								<Input id="server-url" type="url" placeholder="https://myserver.com" disabled />
							</div>

							<div className="space-y-2">
								<Label htmlFor="server-description">Description</Label>
								<Textarea
									id="server-description"
									placeholder="Tell us about your server..."
									className="min-h-[100px] resize-y"
									disabled
								/>
							</div>

							<Button disabled className="w-full">
								Submit Server
							</Button>
						</CardContent>
					</Card>
				</div>
			</main>
		</div>
	);
};
