import React, { useEffect } from "react";

import { useDispatch } from "react-redux";
import { useNavigate } from "react-router";

import { useRelay } from "../../context/relay/index.js";
import { loadChannels } from "../../reducers/channelsReducer.js";
import Layout from "./Layout";

const HomePage = () => {
  const { authenticated } = useRelay();

  const dispatch = useDispatch();

  const navigate = useNavigate();

  useEffect(() => {
    if (!authenticated) {
      navigate("/login");
    } else {
      dispatch(loadChannels());
    }
  }, [dispatch, navigate, authenticated]);

  return (
    <Layout heading="Welcome back!">
      <button onClick={navigate("/channels")}>Start Chatting!</button>
    </Layout>
  );
};

export default HomePage;
