import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Moon, Sun, Monitor } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/context/theme';
import {
  closeSettings,
  toggleHideUnverifiedMessages,
} from '../../../reducers/settingsReducer';
import type { RootState } from '../../../store';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark' | 'system';

export const SettingsModal = () => {
  const dispatch = useDispatch();
  const { isOpen, hideUnverifiedMessages } = useSelector(
    (state: RootState) => state.settings,
  );
  const { theme, setTheme } = useTheme();

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
                    theme === option.value && 'ring-2 ring-primary ring-offset-2'
                  )}
                >
                  {option.icon}
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Messages Section */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Messages</h4>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <label
                  htmlFor="hide-unverified"
                  className="text-sm font-medium cursor-pointer"
                >
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
