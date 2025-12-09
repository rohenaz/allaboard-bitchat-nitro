import { useSelector } from 'react-redux';
import type { RootState } from '../store';

export const useActiveUser = () => {
	const session = useSelector((state: RootState) => state.session);
	return session.user;
};
