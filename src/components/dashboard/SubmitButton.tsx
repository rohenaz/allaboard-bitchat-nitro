import type React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	disabled?: boolean;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ disabled, className, children, ...props }) => {
	return (
		<Button
			disabled={disabled}
			size="sm"
			className={cn('h-auto py-2 px-4 text-sm font-medium', className)}
			{...props}
		>
			{children}
		</Button>
	);
};

export default SubmitButton;
