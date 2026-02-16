import { ArrowLeft } from 'lucide-react';
import type { FC } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { getServerById } from '../constants/servers';
import { toggleHideUnverifiedMessages } from '../reducers/settingsReducer';
import type { RootState } from '../store';

export const ServerSettings: FC = () => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { serverId } = useParams<{ serverId: string }>();
	const { hideUnverifiedMessages } = useSelector((state: RootState) => state.settings);

	const server = serverId ? getServerById(serverId) : undefined;

	if (!server) {
		return (
			<div className="flex flex-col h-screen bg-background overflow-hidden">
				<header className="flex items-center gap-4 p-4 px-6 bg-card border-b shadow-sm">
					<Button
						variant="outline"
						size="sm"
						onClick={() => navigate('/channels')}
						className="gap-2"
					>
						<ArrowLeft className="h-4 w-4" />
						Back
					</Button>
					<div className="flex items-center gap-3 flex-1">
						<h1 className="text-xl font-semibold text-foreground">Server Not Found</h1>
					</div>
				</header>
				<main className="flex-1 overflow-y-auto p-6">
					<Card>
						<CardContent className="pt-6">
							<p className="text-muted-foreground">The server "{serverId}" could not be found.</p>
						</CardContent>
					</Card>
				</main>
			</div>
		);
	}

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
					<img
						src={server.icon}
						alt={server.name}
						className="w-12 h-12 rounded-full bg-background p-2"
					/>
					<div className="flex flex-col">
						<h1 className="text-xl font-semibold text-foreground">{server.name} Settings</h1>
						<p className="text-sm text-muted-foreground mt-1">{server.description}</p>
					</div>
				</div>
			</header>

			<main className="flex-1 overflow-y-auto p-6">
				<Card className="mb-4">
					<CardHeader>
						<CardTitle>Messages</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex items-center justify-between gap-4 py-3">
							<div className="flex-1">
								<Label htmlFor="hide-unverified" className="text-base font-medium cursor-pointer">
									Hide unverified messages
								</Label>
								<p className="text-sm text-muted-foreground mt-1">
									Only show messages that have been verified on the blockchain
								</p>
							</div>
							<Switch
								id="hide-unverified"
								checked={hideUnverifiedMessages}
								onCheckedChange={() => dispatch(toggleHideUnverifiedMessages())}
							/>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Server Information</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="py-3 border-b">
							<div className="flex-1">
								<h3 className="text-base font-medium">Server ID</h3>
								<p className="text-sm text-muted-foreground mt-1">{server._id}</p>
							</div>
						</div>
						<div className="py-3 border-b">
							<div className="flex-1">
								<h3 className="text-base font-medium">Type</h3>
								<p className="text-sm text-muted-foreground mt-1">
									{server.isNative ? 'Native Interface' : 'External Server (iframe)'}
								</p>
							</div>
						</div>
						{server.paymail && (
							<div className="py-3">
								<div className="flex-1">
									<h3 className="text-base font-medium">Paymail</h3>
									<p className="text-sm text-muted-foreground mt-1">{server.paymail}</p>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</main>
		</div>
	);
};
