import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { loadFriends } from "../reducers/memberListReducer";

export const login = createAsyncThunk(
  "session/login",
  async (user, { dispatch, rejectWithValue, getState }) => {
    try {
      // const response = await userAPI.login(userInfo);
      console.log("login", user.bapId);
      dispatch(setBapId(user.bapId));
      dispatch(loadFriends());
      return { bapId: user.bapId };
    } catch (err) {
      return rejectWithValue(err.response.data);
    }
  }
);

// export const signup = createAsyncThunk(
//   "session/signup",
//   async (userInfo, { dispatch, rejectWithValue }) => {
//     try {
//       await userAPI.signup(userInfo);
//       return dispatch(login(userInfo));
//     } catch (err) {
//       return rejectWithValue(err.response.data);
//     }
//   }
// );

const initialState = {
  isAuthenticated: false,
  loading: false,
  user: null,
  error: null,
};

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    connectSocket(state, action) {},
    logout(state, action) {
      state.isAuthenticated = false;
      state.loading = false;
      state.user = null;
      state.error = null;
    },
    setBapId(state, action) {
      console.log("setting bap id to", action.payload);
      state.bapId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state, action) => {
        state.loading = true;
        state.isAuthenticated = false;
      })
      .addCase(login.fulfilled, (state, action) => {
        console.log("login fullfulled", action.payload);
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload;
      });
    // .addCase(signup.pending, (state, action) => {
    //   state.loading = true;
    // })
    // .addCase(signup.fulfilled, (state, action) => {
    //   state.loading = false;
    //   state.error = null;
    // })
    // .addCase(signup.rejected, (state, action) => {
    //   state.loading = false;
    //   state.error = action.payload;
    // });
  },
});

export const { connectSocket, logout, setBapId } = sessionSlice.actions;

export default sessionSlice.reducer;
