import React, { useEffect } from "react";

import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";

import { loadChannels } from "../../reducers/channelsReducer";
import Layout from "./Layout";

const HomePage = () => {
  const dispatch = useDispatch();

  const navigate = useNavigate();

  useEffect(() => {
    // if (!authenticated) {
    //   navigate("/login");
    // } else {
    dispatch(loadChannels());
    //}
  }, [dispatch]);

  return (
    <Layout heading="Welcome back!">
      <button type="button" onClick={navigate("/channels")}>
        Start Chatting!
      </button>
    </Layout>
  );
};

export default HomePage;
