import React, { useCallback, useState } from "react";
import { FaCheck, FaSearch } from "react-icons/fa";
import OutsideClickHandler from "react-outside-click-handler";

import axios from "axios";
import { useNavigate } from "react-router-dom";

const api = axios.create({
  baseURL: "https://bmap-api-production.up.railway.app/q/", // "https://b.map.sv/q/",
});

const DirectMessageModal = ({ open, onClose }) => {
  const [inputValue, setInputValue] = useState();
  const [results, setResults] = useState();
  const changeInput = useCallback((e) => {
    setInputValue(e.target.value);
  }, []);
  const navigate = useNavigate();

  var queryUsers = (term) => {
    return {
      v: 3,
      q: {
        aggregate: [
          {
            $match: {
              "MAP.type": "message",
              $or: [
                { "AIP.bapId": term },
                { "AIP.identity.alternateName": term },
                { "AIP.identity.paymail": term },
              ],
              "AIP.bapId": {
                $exists: true,
              },
            },
          },
          {
            $project: {
              user: 1,
              "AIP.bapId": 1,
              "AIP.identity": 1,
              timestamp: 1,
            },
          },
          {
            $sort: {
              timestamp: -1,
            },
          },
          {
            $group: {
              _id: "$AIP.bapId",
              user: {
                $first: "$AIP.identity",
              },
              last_message_time: {
                $last: "$timestamp",
              },
              actions: {
                $sum: 1,
              },
            },
          },
        ],
        sort: { last_message_time: -1 },
        limit: 100,
      },
    };
  };

  // var queryUsers = (term) => {
  //   return {
  //     v: 3,
  //     q: {
  //       aggregate: [
  //         {"$match": {
  //           "MAP.type": "message",
  //           $or: [
  //             { "AIP.bapId": term },
  //             { "AIP.identity.alternateName": term },
  //             { "AIP.identity.paymail": term },
  //           ],
  //         }, {"$group", ""}
  //       ]
  //       // find: {
  //       //   "MAP.type": "message",
  //       //   $or: [
  //       //     { "AIP.bapId": term },
  //       //     { "AIP.identity.alternateName": term },
  //       //     { "AIP.identity.paymail": term },
  //       //   ],
  //       // },
  //       limit: 100,
  //     },
  //   };
  // };

  const queryUsersB64 = (term) => btoa(JSON.stringify(queryUsers(term)));

  const searchUsers = async (term) => {
    return await api.get(`q/${queryUsersB64(term)}?d=search`);
  };

  const onSubmit = useCallback(async () => {
    // look for inputValue in B.Data.utf8
    // search for the term
    const resp = await searchUsers(inputValue);

    setResults(resp.data.message);
    console.log({ inputValue, resp: resp.data.message });
  }, [results, inputValue, searchUsers]);

  return (
    <div
      style={{
        position: "absolute",
        width: "100vw",
        height: "100dvh",
        background: `rgba(0,0,0,.5)`,
        alignItems: "center",
        justifyContent: "center",
        display: `${open ? "flex" : "none"}`,
        pointerEvents: `${open ? "unset" : "none"}`,
        zIndex: "9999",
      }}
    >
      <OutsideClickHandler onOutsideClick={onClose}>
        <div
          style={{
            background: "#111",
            padding: "2rem",
            margin: "auto",
            borderRadius: "1rem",
            color: "#777",
            zIndex: "999",
          }}
        >
          <div>
            <div style={{ marginBottom: "1rem" }}>
              <b>Create Direct Message</b>
              <p>Enter the BAP ID, name or paymail address of the user.</p>

              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  style={{
                    background: `#333`,
                    color: `#EEE`,
                    width: "100%",
                    padding: ".5rem",
                    border: "0",
                    borderRadius: ".5rem",
                  }}
                  onChange={changeInput}
                  onSubmit
                />

                <div
                  onClick={onSubmit}
                  style={{
                    padding: ".5rem",
                    position: "absolute",
                    right: 0,
                    top: 0,
                    marginRight: ".5rem",
                  }}
                >
                  <FaSearch />
                </div>
              </div>
            </div>

            <div style={{ overflow: "hidden" }}>
              {results?.map((r) => {
                return (
                  <div
                    onClick={() => {
                      onClose();
                      navigate(`/@/${r._id}`);
                    }}
                    style={{ padding: ".5rem", cursor: "pointer" }}
                  >
                    {r.user?.alternateName}
                  </div>
                );
              })}
            </div>
            <br />
            <button
              onClick={onClose}
              style={{
                background: "#000",
                padding: "1rem",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                margin: "auto",
              }}
            >
              <FaCheck style={{ marginRight: ".5rem" }} /> Okay
            </button>
          </div>
        </div>
      </OutsideClickHandler>
    </div>
  );
};

export default DirectMessageModal;
