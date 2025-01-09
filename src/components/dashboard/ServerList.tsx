import type { FC } from 'react';
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useHandcash } from '../../context/handcash';
import { useYours } from '../../context/yours';
import { loadChannels } from '../../reducers/channelsReducer';
import type { AppDispatch, RootState } from '../../store';
import Avatar from './Avatar';

interface Server {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  paymail?: string;
}

interface ServerState {
  loading: boolean;
  error: string | null;
  data: Server[];
}

interface SessionUser {
  idKey?: string;
  paymail?: string;
  logo?: string;
}

interface SessionState {
  user?: SessionUser | null;
}

const ServerList: FC = () => {
  const { authToken } = useHandcash();
  const { connected } = useYours();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const servers = useSelector<RootState, ServerState>((state) => state.servers);
  const session = useSelector<RootState, SessionState>((state) => state.session);

  const handleServerClick = useCallback(
    (serverId: string) => {
      navigate(`/servers/${serverId}`);
    },
    [navigate],
  );

  const handleHomeClick = useCallback(() => {
    navigate('/channels/@me');
  }, [navigate]);

  const handleAddServer = useCallback(() => {
    navigate('/servers/new');
  }, [navigate]);

  useEffect(() => {
    if (authToken || connected) {
      void dispatch(loadChannels());
    }
  }, [authToken, connected, dispatch]);

  return (
    <div className="w-[72px] bg-base-300 flex flex-col items-center py-3 gap-2">
      <button
        className="btn btn-ghost btn-circle"
        onClick={handleHomeClick}
      >
        <Avatar
          size="48px"
          paymail={session.user?.paymail}
          icon={session.user?.logo}
        />
      </button>

      <div className="divider divider-horizontal my-2" />

      <div className="flex flex-col gap-2 overflow-y-auto">
        {servers.data.map((server) => (
          <button
            key={server._id}
            className="btn btn-ghost btn-circle"
            onClick={() => handleServerClick(server._id)}
          >
            <Avatar
              size="48px"
              paymail={server.name}
              icon={server.icon}
            />
          </button>
        ))}
      </div>

      <div className="divider divider-horizontal my-2" />

      <button
        className="btn btn-ghost btn-circle"
        onClick={handleAddServer}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
      </button>
    </div>
  );
};

export default ServerList;
