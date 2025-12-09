import type React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export const minutesPerUnit = 60;

interface PinChannelModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: (units: number) => void;
}

const PinChannelModal: React.FC<PinChannelModalProps> = ({ open, onOpenChange, onConfirm }) => {
	const [units, setUnits] = useState(1);

	const handleConfirm = () => {
		onConfirm(units);
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[400px]">
				<DialogHeader>
					<DialogTitle>Pin Channel</DialogTitle>
					<DialogDescription>
						Enter the number of units to pin this channel. Each unit represents {minutesPerUnit}{' '}
						minutes.
					</DialogDescription>
				</DialogHeader>

				<div className="flex gap-2 items-center py-4">
					<Input
						type="number"
						min="1"
						value={units}
						onChange={(e) => setUnits(Number.parseInt(e.target.value, 10) || 1)}
						className="w-20"
					/>
					<span className="text-sm text-muted-foreground">units</span>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={handleConfirm}>Pin Channel</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default PinChannelModal;
