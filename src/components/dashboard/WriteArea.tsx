import type React from 'react';
import { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useBitcoin } from '../../context/bitcoin';
import { useHandcash } from '../../context/handcash';
import { useYours } from '../../context/yours';
import type { RootState } from '../../types';

interface PendingFile {
  name: string;
  size: number;
  type: string;
  data: ArrayBuffer;
}

const WriteArea: React.FC = () => {
  const [content, setContent] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { profile } = useHandcash();
  const { pandaProfile } = useYours();
  const { sendMessage, pendingFiles, setPendingFiles } = useBitcoin();
  const params = useParams();

  const activeChannelId = params.channel;
  const activeUserId = params.user;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const hasContent = content.trim().length > 0;

      if (hasContent && (profile?.paymail || pandaProfile)) {
        try {
          await sendMessage(
            profile?.paymail || pandaProfile?.displayName || '',
            content,
            activeChannelId,
            activeUserId,
          );
          setContent('');
          setPendingFiles([]);
        } catch (error) {
          console.error('Error sending message:', error);
        }
      }
    },
    [
      content,
      profile,
      pandaProfile,
      sendMessage,
      activeChannelId,
      activeUserId,
      setPendingFiles,
    ],
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as unknown as React.FormEvent);
      }
    },
    [handleSubmit],
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files?.length) return;

      const files = Array.from(e.target.files);

      try {
        const newPendingFiles: PendingFile[] = await Promise.all(
          files.map(async (file) => {
            const buffer = await file.arrayBuffer();
            return {
              name: file.name,
              size: file.size,
              type: file.type,
              data: buffer,
            };
          }),
        );

        setPendingFiles((prev) => [...prev, ...newPendingFiles]);
      } catch (error) {
        console.error('Error processing files:', error);
      }
    },
    [setPendingFiles],
  );

  return (
    <div className="p-4 border-t border-gray-200">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <textarea
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />

          <div className="absolute bottom-2 right-2 flex space-x-2">
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer text-gray-500 hover:text-gray-700"
            >
              Attach Files
            </label>
          </div>
        </div>

        {pendingFiles.length > 0 && (
          <div className="mt-2 space-y-2">
            {pendingFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <span>{file.name}</span>
                <button
                  type="button"
                  onClick={() =>
                    setPendingFiles((files) =>
                      files.filter((_, i) => i !== index),
                    )
                  }
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="submit"
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default WriteArea;
