import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { YoursIcon, useYoursWallet } from 'yours-wallet-provider';
import { useBap } from '../../context/bap';
import { useHandcash } from '../../context/handcash';
import { loadChannels } from '../../reducers/channelsReducer';
import { loadFriends } from '../../reducers/memberListReducer';
import { login } from '../../reducers/sessionReducer';
import type { AppDispatch } from '../../store';
import HandcashIcon from '../icons/HandcashIcon';
import Form from './Form';
import Label from './Label';
import Layout from './Layout';
import SubmitButton from './SubmitButton';

interface Profile {
  id: string;
  paymail?: string;
}

interface BapAuth {
  id: string;
}

interface SessionState {
  error: string;
  user?: {
    idKey?: string;
  };
}

interface RootState {
  session: SessionState;
}

const LoginPage: React.FC = () => {
  const [selectedWallet, setSelectedWallet] = useState<'handcash' | 'yours'>(
    'handcash',
  );
  const { profile } = useHandcash();
  const { pandaAuth } = useBap();
  const { connect: connectYours } = useYoursWallet();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        if (selectedWallet === 'yours') {
          await connectYours();
        }
      } catch (_error) {
        // Error handling is done by the wallet provider
      }
    },
    [selectedWallet, connectYours],
  );

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const session = useSelector((state: RootState) => state.session);

  useEffect(() => {
    const loginUser = async () => {
      if (profile || pandaAuth) {
        const idKey = (profile as Profile)?.id || (pandaAuth as BapAuth)?.id;
        if (idKey) {
          try {
            await dispatch(login({ bapId: idKey }));
            await dispatch(loadFriends());
            await dispatch(loadChannels());
            navigate('/channels/nitro');
          } catch (error) {
            console.error('Login failed:', error);
          }
        }
      }
    };
    loginUser();
  }, [dispatch, navigate, profile, pandaAuth]);

  const walletChanged = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSelectedWallet(e.target.value as 'handcash' | 'yours');
    },
    [],
  );

  return (
    <Layout heading="Welcome back!">
      <Form onSubmit={handleSubmit}>
        <span className="errorMessage" style={{ textAlign: 'center' }}>
          {session.error}
        </span>
        <Label htmlFor="handcash">
          <input
            type="radio"
            name="wallet"
            id="handcash"
            value="handcash"
            style={{ marginRight: '.5rem' }}
            onChange={walletChanged}
            checked={selectedWallet === 'handcash'}
          />
          Handcash
        </Label>
        <Label htmlFor="yours">
          <input
            type="radio"
            name="wallet"
            id="yours"
            value="yours"
            onChange={walletChanged}
            style={{ marginRight: '.5rem' }}
            checked={selectedWallet === 'yours'}
          />
          Yours
        </Label>

        <SubmitButton
          style={{
            backgroundColor:
              selectedWallet === 'handcash'
                ? '#2fac69'
                : selectedWallet === 'yours'
                  ? 'rgba(154, 224, 133, 0.25)'
                  : 'rgb(88, 101, 242)',
          }}
        >
          {selectedWallet === 'handcash' ? (
            <HandcashIcon style={{ width: '1rem', marginRight: '1rem' }} />
          ) : selectedWallet === 'yours' ? (
            <div className="mr-3">
              <YoursIcon size={'1rem'} />
            </div>
          ) : (
            <></>
          )}
          {`Login with ${
            selectedWallet === 'handcash'
              ? 'Handcash'
              : selectedWallet === 'yours'
                ? 'Yours Wallet'
                : ''
          }`}
        </SubmitButton>
        <div>
          Need an account?{' '}
          <a
            href={
              selectedWallet === 'yours'
                ? 'https://chromewebstore.google.com/detail/yours-wallet/mlbnicldlpdimbjdcncnklfempedeipj'
                : 'https://app.handcash.io/'
            }
            target="_blank"
            rel="noreferrer noopener"
          >
            Register
          </a>
        </div>
        <div>
          {' '}
          <a href={'/channels'}>Continue as guest (read only)</a>
        </div>
      </Form>
    </Layout>
  );
};

export default LoginPage;
