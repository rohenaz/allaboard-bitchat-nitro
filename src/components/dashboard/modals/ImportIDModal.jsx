import React, { useCallback } from 'react';
import { FaCheck, FaUpload } from 'react-icons/fa';
import { ImProfile } from 'react-icons/im';
import OutsideClickHandler from 'react-outside-click-handler';
import { useDispatch, useSelector } from 'react-redux';
import { useBap } from '../../../context/bap';
import { toggleProfile } from '../../../reducers/profileReducer';
import { FetchStatus } from '../../../utils/common';

const ImportIDModal = () => {
  const isProfileOpen = useSelector((state) => state.profile.isOpen);
  const { onFileChange, identity, loadIdentityStatus } = useBap();
  const inputFileRef = React.useRef();

  const uploadIdentity = useCallback(() => {
    inputFileRef.current.click();
  }, []);

  const dispatch = useDispatch();

  return (
    <div
      style={{
        position: 'absolute',
        width: '100vw',
        height: '100dvh',
        background: 'rgba(0,0,0,.5)',
        alignItems: 'center',
        justifyContent: 'center',
        display: `${isProfileOpen ? 'flex' : 'none'}`,
        pointerEvents: `${isProfileOpen ? 'unset' : 'none'}`,
      }}
    >
      <OutsideClickHandler
        onOutsideClick={() => {
          if (isProfileOpen) {
            dispatch(toggleProfile());
          }
        }}
      >
        <div style={{ background: '#fff', padding: '2rem', margin: 'auto' }}>
          {identity ? (
            <div>
              <b>Import Successful</b>
              <p>Your messages will be signed with your identity key.</p>

              <br />
              <button
                type="button"
                onClick={() => dispatch(toggleProfile())}
                style={{
                  backgroundColor: '#000',
                  color: '#fff',
                  padding: '.5rem 1rem',
                  borderRadius: '.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  margin: 'auto',
                }}
              >
                <FaCheck style={{ marginRight: '.5rem' }} /> Okay
              </button>
            </div>
          ) : (
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '1rem',
                }}
              >
                <ImProfile style={{ marginRight: '.5rem', width: '32px' }} />
                <h2>Import Identity</h2>
              </div>
              {loadIdentityStatus === FetchStatus.Error && (
                <div>Error loading identity file</div>
              )}
              <ol className="mb-2">
                <li>Visit blockpost.network</li>
                <li>Export your identity file</li>
                <li>Import it here</li>
              </ol>

              <button
                type="button"
                onClick={uploadIdentity}
                className="bg-slate-800 px-2 py-1 text-white flex items-center m-auto rounded-sm"
              >
                <FaUpload style={{ marginRight: '.5rem' }} />{' '}
                {loadIdentityStatus === FetchStatus.Loading
                  ? 'Loading...'
                  : 'Upload Identity'}
              </button>
            </div>
          )}
        </div>
        <input
          type="file"
          ref={inputFileRef}
          onChange={onFileChange}
          style={{ display: 'none' }}
        />
      </OutsideClickHandler>
    </div>
  );
};

export default ImportIDModal;
