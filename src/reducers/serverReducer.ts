import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { SERVERS, type ServerDefinition } from '../constants/servers';
import type { AppDispatch } from '../store';

interface ServerState {
	loading: boolean;
	error: string | null;
	data: ServerDefinition[];
}

const initialState: ServerState = {
	loading: false,
	error: null,
	data: SERVERS,
};

const serverSlice = createSlice({
	name: 'servers',
	initialState,
	reducers: {
		fetchServersStart(state) {
			state.loading = true;
			state.error = null;
		},
		fetchServersSuccess(state, action: PayloadAction<ServerDefinition[]>) {
			state.loading = false;
			state.data = action.payload;
		},
		fetchServersFailure(state, action: PayloadAction<string>) {
			state.loading = false;
			state.error = action.payload;
		},
		addServer(state, action: PayloadAction<ServerDefinition>) {
			state.data.push(action.payload);
		},
		removeServer(state, action: PayloadAction<string>) {
			state.data = state.data.filter((server) => server._id !== action.payload);
		},
	},
});

export const {
	fetchServersStart,
	fetchServersSuccess,
	fetchServersFailure,
	addServer,
	removeServer,
} = serverSlice.actions;

export const fetchServers = () => async (dispatch: AppDispatch) => {
	try {
		dispatch(fetchServersStart());
		// Since there's no API endpoint yet, we'll just return success with the server definitions
		dispatch(fetchServersSuccess(SERVERS));
	} catch (error) {
		dispatch(
			fetchServersFailure(error instanceof Error ? error.message : 'Failed to fetch servers'),
		);
	}
};

export default serverSlice.reducer;
