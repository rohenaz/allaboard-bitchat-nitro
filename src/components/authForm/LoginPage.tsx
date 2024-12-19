import type React from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import { YoursIcon, useYoursWallet } from 'yours-wallet-provider';
import { useBap } from '../../context/bap';
import { useHandcash } from '../../context/handcash';
import { loadChannels } from '../../reducers/channelsReducer';
import env from '../../utils/env';
import HandcashIcon from '../icons/HandcashIcon';
import Form from './Form';
import Label from './Label';
import Layout from './Layout';
import SubmitButton from './SubmitButton';

interface SessionState {
  error: string;
}

interface RootState {
  session: SessionState;
}

const LoginPage: React.FC = () => {
  const { isReady, connect, isConnected } = useYoursWallet();
  const [pandaAuth, setPandaAuth] = useState<boolean>();

  const { setAuthToken, profile, getProfile } = useHandcash();
  const dispatch = useDispatch();
  const [selectedWallet, setSelectedWallet] = useState<'handcash' | 'yours'>(
    'handcash',
  );

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has('authToken')) {
      const token = searchParams.get('authToken');
      if (token) {
        setAuthToken(token);
        getProfile();
      }
    }
  }, [getProfile, setAuthToken]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const target = event.target as typeof event.target & {
        wallet: { value: 'handcash' | 'yours' };
      };

      if (target.wallet.value === 'handcash') {
        window.location.href = `${env.REACT_APP_API_URL}/hcLogin`;
        return;
      }

      if (target.wallet.value === 'yours') {
        if (!isReady) {
          window.open(
            'https://chromewebstore.google.com/detail/yours-wallet/mlbnicldlpdimbjdcncnklfempedeipj',
            '_blank',
          );
          return;
        }
        const connected = await isConnected();
        if (connected) {
          setPandaAuth(true);
          return;
        }
        const keys = await connect();

        if (keys) {
          setPandaAuth(true);
        }
      }
    },
    [isReady, connect, isConnected],
  );

  const navigate = useNavigate();
  const session = useSelector((state: RootState) => state.session);
  useEffect(() => {
    if (profile || pandaAuth) {
      dispatch(loadChannels());
      navigate('/channels/nitro');
    }
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
          bgcolor={
            selectedWallet === 'handcash'
              ? '#2fac69'
              : selectedWallet === 'your'
                ? 'rgba(154, 224, 133, 0.25)'
                : 'rgb(88, 101, 242)'
          }
          bgcolorhover={
            selectedWallet === 'handcash'
              ? '#08a350'
              : selectedWallet === 'yours'
                ? 'rgba(154, 224, 133, 0.1)'
                : 'rgb(71, 82, 196)'
          }
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
