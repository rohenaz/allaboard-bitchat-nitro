import React, { useCallback, useState } from "react";
import { FaCheck, FaSearch } from "react-icons/fa";
import OutsideClickHandler from "react-outside-click-handler";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import tw from "twin.macro";

const api = axios.create({
  baseURL: "https://bmap-api-production.up.railway.app/q/",
});

const ModalOverlay = tw.div`
  absolute w-screen h-screen bg-black/50 flex items-center justify-center z-[9999]
`;

const ModalContent = tw.div`
  bg-[#111] p-8 rounded-2xl text-[#777] z-[999]
`;

const SearchInput = tw.input`
  bg-[#333] text-[#EEE] w-full p-2 border-0 rounded-lg
`;

const SearchButton = tw.button`
  p-2 absolute right-0 top-0 mr-2
`;

const UserButton = tw.button`
  p-2 cursor-pointer hover:text-[#EEE] transition-colors
`;

const OkayButton = tw.button`
  bg-black p-4 text-white flex items-center mx-auto hover:bg-[#222] transition-colors
`;

const DirectMessageModal = ({ open, onClose }) => {
  const [inputValue, setInputValue] = useState("");
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  const queryUsers = useCallback((term) => {
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
  }, []);

  const queryUsersB64 = useCallback(
    (term) => btoa(JSON.stringify(queryUsers(term))),
    [queryUsers]
  );

  const searchUsers = useCallback(
    async (term) => {
      return await api.get(`q/${queryUsersB64(term)}?d=search`);
    },
    [queryUsersB64]
  );

  const handleInputChange = useCallback((e) => {
    setInputValue(e.target.value);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!inputValue.trim()) return;
    
    try {
      const resp = await searchUsers(inputValue);
      setResults(resp.data.message || []);
    } catch (error) {
      console.error("Error searching users:", error);
      setResults([]);
    }
  }, [inputValue, searchUsers]);

  const handleUserSelect = useCallback((userId) => {
    onClose();
    navigate(`/@/${userId}`);
  }, [navigate, onClose]);

  if (!open) return null;

  return (
    <ModalOverlay>
      <OutsideClickHandler onOutsideClick={onClose}>
        <ModalContent>
          <div>
            <div className="mb-4">
              <b>Create Direct Message</b>
              <p>Enter the BAP ID, name or paymail address of the user.</p>

              <div className="relative">
                <SearchInput
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder="Search users..."
                />

                <SearchButton type="button" onClick={handleSubmit}>
                  <FaSearch />
                </SearchButton>
              </div>
            </div>

            <div className="overflow-hidden">
              {results.map((r) => (
                <UserButton
                  key={r._id}
                  type="button"
                  onClick={() => handleUserSelect(r._id)}
                >
                  {r.user?.alternateName}
                </UserButton>
              ))}
            </div>
            <br />
            <OkayButton type="button" onClick={onClose}>
              <FaCheck className="mr-2" /> Okay
            </OkayButton>
          </div>
        </ModalContent>
      </OutsideClickHandler>
    </ModalOverlay>
  );
};

export default DirectMessageModal;
