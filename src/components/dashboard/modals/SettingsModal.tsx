/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

import { type FC, type MouseEvent, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  toggleHideUnverifiedMessages,
  toggleSettings,
} from '../../../reducers/settingsReducer';
import { ThemeSwitcher } from '../../settings/ThemeSwitcher';
import type { RootState } from '../../../store';

export const SettingsModal: FC = () => {
  const dispatch = useDispatch();
  const { isOpen, hideUnverifiedMessages } = useSelector(
    (state: RootState) => state.settings,
  );
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Handle modal open/close
  useEffect(() => {
    if (isOpen && dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    } else if (!isOpen && dialogRef.current?.open) {
      dialogRef.current.close();
    }
  }, [isOpen]);

  const handleClose = () => {
    dispatch(toggleSettings());
  };

  // Handle click outside
  const handleClickOutside = (e: MouseEvent) => {
    const dialogDimensions = dialogRef.current?.getBoundingClientRect();
    if (dialogDimensions) {
      if (
        e.clientX < dialogDimensions.left ||
        e.clientX > dialogDimensions.right ||
        e.clientY < dialogDimensions.top ||
        e.clientY > dialogDimensions.bottom
      ) {
        handleClose();
      }
    }
  };

  return (
    <dialog 
      ref={dialogRef} 
      className="modal modal-bottom sm:modal-middle"
      onClick={handleClickOutside}
    >
      <div className="modal-box bg-base-200 shadow-lg" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-lg mb-4">Settings</h3>
        <div className="space-y-6">
          <div className="bg-base-300 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Messages</h4>
            <div className="form-control">
              <label className="label cursor-pointer justify-between">
                <span className="label-text">Hide unverified messages</span>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={hideUnverifiedMessages}
                  onChange={() => dispatch(toggleHideUnverifiedMessages())}
                />
              </label>
            </div>
          </div>
          <div className="bg-base-300 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Appearance</h4>
            <ThemeSwitcher />
          </div>
        </div>
        <div className="modal-action">
          <form method="dialog">
            <button className="btn btn-primary" onClick={handleClose}>Close</button>
          </form>
        </div>
      </div>
    </dialog>
  );
};

export default SettingsModal; 