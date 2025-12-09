import { useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { getBase64Url } from '../../../utils/file';

interface FileType {
	txid?: string;
	name?: string;
	url?: string;
	'content-type'?: string;
	media_type?: string;
}

interface FilePreviewModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	file: FileType | null;
}

const FilePreviewModal = ({ open, onOpenChange, file }: FilePreviewModalProps) => {
	const b64 = useMemo(() => (file ? getBase64Url(file) : null), [file]);

	if (!b64) {
		return null;
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-4xl p-0 overflow-hidden">
				<img src={b64} alt={file?.name || 'Preview'} className="w-full h-auto" />
			</DialogContent>
		</Dialog>
	);
};

export default FilePreviewModal;
