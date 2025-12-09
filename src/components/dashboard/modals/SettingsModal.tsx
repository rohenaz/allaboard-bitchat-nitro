import { useThemeTokenContext } from '@theme-token/sdk/react';
import { ExternalLink, Loader2, Monitor, Moon, Palette, RefreshCw, Sun, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/context/theme';
import { cn } from '@/lib/utils';
import { useOwnedThemes } from '../../../hooks/useOwnedThemes';
import { closeSettings, toggleHideUnverifiedMessages } from '../../../reducers/settingsReducer';
import type { RootState } from '../../../store';
import { SubscriptionPanel } from '../SubscriptionPanel';

type Theme = 'light' | 'dark' | 'system';

export const SettingsModal = () => {
	const dispatch = useDispatch();
	const { isOpen, hideUnverifiedMessages } = useSelector((state: RootState) => state.settings);
	const session = useSelector((state: RootState) => state.session);
	const { theme, setTheme } = useTheme();
	const { activeTheme, activeOrigin, loadTheme, resetTheme, isLoading, error } =
		useThemeTokenContext();
	const { themes: ownedThemes, loading: loadingThemes, refresh: refreshThemes } = useOwnedThemes();
	const [themeOriginInput, setThemeOriginInput] = useState('');

	const handleClose = useCallback(() => {
		dispatch(closeSettings());
	}, [dispatch]);

	const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
		{ value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
		{ value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
		{ value: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> },
	];

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
			<DialogContent className="sm:max-w-[480px]">
				<DialogHeader>
					<DialogTitle>Settings</DialogTitle>
				</DialogHeader>

				<div className="space-y-6 py-4">
					{/* Theme Section */}
					<div className="space-y-3">
						<h4 className="text-sm font-medium">Appearance</h4>
						<div className="flex gap-2">
							{themeOptions.map((option) => (
								<Button
									key={option.value}
									variant={theme === option.value ? 'default' : 'outline'}
									size="sm"
									onClick={() => setTheme(option.value)}
									className={cn(
										'flex-1 gap-2',
										theme === option.value && 'ring-2 ring-primary ring-offset-2',
									)}
								>
									{option.icon}
									{option.label}
								</Button>
							))}
						</div>
					</div>

					{/* Theme Token Section */}
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<h4 className="text-sm font-medium flex items-center gap-2">
								<Palette className="h-4 w-4" />
								Theme Token
							</h4>
							<div className="flex items-center gap-1">
								{session.isAuthenticated && (
									<Button
										variant="ghost"
										size="icon"
										onClick={refreshThemes}
										disabled={loadingThemes}
										className="h-7 w-7"
									>
										<RefreshCw className={cn('h-3 w-3', loadingThemes && 'animate-spin')} />
									</Button>
								)}
								{activeTheme && (
									<Button
										variant="ghost"
										size="sm"
										onClick={resetTheme}
										className="h-7 text-xs text-muted-foreground hover:text-foreground"
									>
										<X className="h-3 w-3 mr-1" />
										Reset
									</Button>
								)}
							</div>
						</div>

						{/* Active Theme Display */}
						{activeTheme && (
							<div className="rounded-lg border border-primary p-3 space-y-2">
								<div className="flex items-center justify-between">
									<span className="font-medium">{activeTheme.name}</span>
									<a
										href={`https://themetoken.dev/preview/${activeOrigin}`}
										target="_blank"
										rel="noopener noreferrer"
										className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
									>
										Preview <ExternalLink className="h-3 w-3" />
									</a>
								</div>
								{activeTheme.author && (
									<p className="text-xs text-muted-foreground">by {activeTheme.author}</p>
								)}
								<p className="text-xs text-muted-foreground font-mono truncate">
									{activeOrigin?.slice(0, 12)}...{activeOrigin?.slice(-8)}
								</p>
							</div>
						)}

						{/* Owned Themes Grid */}
						{session.isAuthenticated && (
							<div className="space-y-2">
								<p className="text-xs text-muted-foreground">Your owned themes:</p>
								{loadingThemes ? (
									<div className="flex justify-center py-4">
										<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
									</div>
								) : ownedThemes.length > 0 ? (
									<div className="grid grid-cols-2 gap-2">
										{ownedThemes.map((ownedTheme) => (
											<button
												type="button"
												key={ownedTheme.origin}
												onClick={() => loadTheme(ownedTheme.origin)}
												disabled={isLoading}
												className={cn(
													'p-3 rounded-lg border text-left transition-colors',
													activeOrigin === ownedTheme.origin
														? 'border-primary bg-primary/5'
														: 'hover:border-primary/50',
												)}
											>
												<span className="text-sm font-medium truncate block">
													{ownedTheme.name || `${ownedTheme.origin.slice(0, 12)}...`}
												</span>
												{ownedTheme.author && (
													<span className="text-xs text-muted-foreground">
														by {ownedTheme.author}
													</span>
												)}
											</button>
										))}
									</div>
								) : (
									<p className="text-xs text-muted-foreground py-2">
										No ThemeToken NFTs found in your connected wallets.
									</p>
								)}
							</div>
						)}

						{/* Debug Input (collapsible) */}
						<details className="text-xs">
							<summary className="cursor-pointer text-muted-foreground hover:text-foreground">
								Load by origin (debug)
							</summary>
							<div className="flex gap-2 mt-2">
								<input
									type="text"
									value={themeOriginInput}
									onChange={(e) => setThemeOriginInput(e.target.value)}
									placeholder="Enter theme origin (txid_vout)"
									className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
								/>
								<Button
									size="sm"
									onClick={() => {
										if (themeOriginInput.trim()) {
											loadTheme(themeOriginInput.trim());
											setThemeOriginInput('');
										}
									}}
									disabled={isLoading || !themeOriginInput.trim()}
								>
									{isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Load'}
								</Button>
							</div>
							{error && <p className="text-xs text-destructive mt-2">{error.message}</p>}
						</details>

						<a
							href="https://themetoken.dev/themes"
							target="_blank"
							rel="noopener noreferrer"
							className="text-xs text-primary hover:underline flex items-center gap-1"
						>
							Browse themes <ExternalLink className="h-3 w-3" />
						</a>
					</div>

					{/* Messages Section */}
					<div className="space-y-3">
						<h4 className="text-sm font-medium">Messages</h4>
						<div className="flex items-center justify-between rounded-lg border p-4">
							<div className="space-y-0.5">
								<label htmlFor="hide-unverified" className="text-sm font-medium cursor-pointer">
									Hide unverified messages
								</label>
								<p className="text-xs text-muted-foreground">
									Only show messages from verified identities
								</p>
							</div>
							<Switch
								id="hide-unverified"
								checked={hideUnverifiedMessages}
								onCheckedChange={() => dispatch(toggleHideUnverifiedMessages())}
							/>
						</div>
					</div>

					{/* Subscription Section */}
					<div className="space-y-3">
						<h4 className="text-sm font-medium">Subscription</h4>
						<SubscriptionPanel />
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default SettingsModal;
