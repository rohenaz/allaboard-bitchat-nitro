import bops from "bops";
import { ECIES, Hash, Script } from "@bsv/sdk";
import { head } from "lodash";
import moment from "moment";
import React, {
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import { useParams } from "react-router-dom";
import { pinPaymentAddress } from "../../reducers/channelsReducer";
import {
	receiveNewMessage,
	receiveNewReaction,
} from "../../reducers/chatReducer";
import { FetchStatus } from "../../utils/common";
import env from "../../utils/env";
import { getSigningPathFromHex } from "../../utils/sign";
import { useBap } from "../bap";
import { useBmap } from "../bmap";
import { useHandcash } from "../handcash";
import { useYours } from "../yours";
import { BAP } from "bsv-bap";

const BitcoinContext = React.createContext(undefined);

const BitcoinProvider = (props) => {
	const { notifyIndexer } = useBmap();
	const { authToken, hcDecrypt } = useHandcash();
	const { pandaProfile, utxos, broadcast, getSignatures, sendBsv } = useYours();
	const { decIdentity, decryptStatus } = useBap();
	const [pinStatus, setPinStatus] = useState(FetchStatus.Idle);
	const [postStatus, setPostStatus] = useState(FetchStatus.Idle);
	const [pendingFiles, setPendingFiles] = useState([]);

	// TODO: Hook up like status
	const [likeStatus, setLikeStatus] = useState(FetchStatus.Idle);
	const params = useParams();
	const storeAPI = useStore();
	const [signStatus, setSignStatus] = useState(FetchStatus.Idle);
	const dispatch = useDispatch();

	const [friendRequestStatus, setFriendRequestStatus] = useState(
		FetchStatus.Idle,
	);
	const session = useSelector((state) => state.session);

	const friendRequestsLoading = useSelector(
		(state) => state.memberList.friendRequests.loading,
	);

	const activeChannelId = useMemo(() => {
		return params.channel;
	}, [params]);

	const activeUserId = useMemo(() => {
		return params.user;
	}, [params]);

	const signOpReturnWithAIP = useCallback(
		async (hexArray) => {
			return new Promise((resolve, reject) => {
				setSignStatus(FetchStatus.Loading);
				// if we dont have the paymail, get it
				if (decIdentity) {
					// const decIdentity = await hcDecrypt(identity);
					// console.log("sign with", decIdentity);

					console.info({ BAP, decIdentity });

					const bapId = new BAP(decIdentity.xprv);
					console.info("BAP id", bapId);
					if (decIdentity.ids) {
						bapId.importIds(decIdentity.ids);
					}

					const ids = bapId.listIds();
					console.info({ ids });
					const idy = bapId.getId(ids[0]); // only support for 1 id per profile now
					console.log({
						idy: idy.signOpReturnWithAIP,
						getAipBuf: idy.getAIPMessageBuffer,
					});

					// const aipBuff = idy.getAIPMessageBuffer();
					// console.log({ aipBuff, apiString: aipBuff.toString("utf8") });

					console.info({ hexArray, buff: Buffer });
					const signedOps = idy.signOpReturnWithAIP(hexArray);

					setSignStatus(FetchStatus.Success);
					resolve(signedOps);

					// if (encryptedIdentity) {
					//   decIdentity

					//   fetch(`https://bitchatnitro.com/hcsignops`, {
					//     method: "POST",
					//     headers: {
					//       "Content-type": "application/json",
					//     },
					//     body: JSON.stringify({ authToken, encryptedIdentity, hexArray }),
					//   })
					//     .then((resp) => {
					//       setSignStatus(FetchStatus.Success);
					//       resp.json().then(resolve);
					//     })
					//     .catch((e) => {
					//       setSignStatus(FetchStatus.Error);
					//       reject(e);
					//     });
					// }
				} else {
					setSignStatus(FetchStatus.Error);
					// console.log({ decIdentity });
					reject(new Error("no auth token"));
				}
			});
		},
		[decIdentity],
	);

	useEffect(() => {
		console.log({ friendRequestsLoading, pandaProfile });
	}, [friendRequestsLoading, pandaProfile]);

	const sendPin = useCallback(
		async (pm, channel, units) => {
			// TODO: Add panda support
			// in minutes
			// 0.001 BSV/10 minutes
			const pinPaymentAmount = 0.001 * units;
			setPinStatus(FetchStatus.Loading);
			try {
				const dataPayload = [
					MAP_PREFIX, // MAP Prefix
					"SET",
					"app",
					"bitchatnitro.com",
					"type",
					"pin_channel",
					"paymail",
					pm,
					"context",
					"channel",
					"channel",
					channel,
				];

				const hexArray = dataPayload.map((d) =>
					Buffer.from(d, "utf8").toString("hex"),
				);
				if (decIdentity) {
					// decrypt and import identity
					const signedOps = await signOpReturnWithAIP(hexArray);

					const resp = await fetch(`${env.REACT_APP_API_URL}/hcSend/`, {
						method: "POST",
						headers: new Headers({ "Content-Type": "application/json" }),
						body: JSON.stringify({
							to: pinPaymentAddress,
							amount: pinPaymentAmount,
							currency: "BSV",
							hexArray: signedOps, // remove op_false op_return
							authToken,
							channel,
						}),
					});

					const { paymentResult } = await resp.json();
					setPinStatus(FetchStatus.Success);

					console.log({ paymentResult });
					if (paymentResult?.rawTransactionHex) {
						try {
							await notifyIndexer(paymentResult.rawTransactionHex);
						} catch (e) {
							console.log("failed to notify indexer", e);
							setPinStatus(FetchStatus.Error);

							return;
						}
					}

					return;
				}

				// check for handcash token
				// let authToken = localStorage.getItem("bitchat-nitro.hc-auth-token");
				if (authToken) {
					const hexArray = dataPayload.map((str) =>
						bops.to(bops.from(str, "utf8"), "hex"),
					);
					// .join(" ")

					const resp = await fetch(`${env.REACT_APP_API_URL}/hcSend/`, {
						method: "POST",
						headers: new Headers({ "Content-Type": "application/json" }),
						body: JSON.stringify({ hexArray, authToken, channel }),
					});

					const { paymentResult } = await resp.json();
					console.log({ paymentResult });
					setPinStatus(FetchStatus.Success);

					await notifyIndexer(paymentResult.rawTransactionHex);
					return;
					// https://bitchatnitro.com/hcsend/
					// { hexArray, authToken}
				}
				// const script = nimble.Script.fromASM(
				//   "OP_0 OP_RETURN " +
				//     dataPayload
				//       .map((str) => bops.to(bops.from(str, "utf8"), "hex"))
				//       .join(" ")
				// );
				// let outputs = [{ script: script.toASM(), amount: 0, currency: "BSV" }];

				// if (pinPaymentAddress && units) {
				//   outputs.push({
				//     to: pinPaymentAddress,
				//     amount: pinPaymentAmount,
				//     currency: "BSV",
				//   });
				// }
				// let resp = await relayOne.send({ outputs });
				// setPinStatus(FetchStatus.Success);

				// console.log("Sent pin", resp);
				// interface SendResult {
				//   txid: string;
				//   rawTx: string;
				//   amount: number; // amount spent in button currency
				//   currency: string; // button currency
				//   satoshis: number; // amount spent in sats
				//   paymail: string; // user paymail deprecated
				//   identity: string; // user pki deprecated
				// }
				// try {
				//   await notifyIndexer(resp.rawTx);
				// } catch (e) {
				//   console.log("failed to notify indexer", e);
				//   return;
				// }
			} catch (e) {
				console.error(e);
				setPinStatus(FetchStatus.Error);
			}
		},
		[decIdentity, authToken, notifyIndexer, signOpReturnWithAIP],
	);

	const pendingFilesOutputs = useMemo(() => {
		return pendingFiles
			.map((f) => {
				if (!!f.b64 && f.b64.length > 0) {
					// 1. Detect mime type
					const mimeType = f.type;

					// 2. Get b64 encoded binary content
					const [, base64Data] = f.b64.split(";base64,");
					const content = Buffer.from(base64Data, "base64");
					const filename = f.name;

					const dataPayload = [
						B_PREFIX, // B Prefix
						content,
						mimeType,
						"base64",
					];

					return dataPayload;
				}
			})
			.filter(Boolean);
	}, [pendingFiles]);

	const sendMessageWithRelay = useCallback(async (signedDataOuts) => {}, []);

	const sendMessageWithHandcash = useCallback(async (signedDataOuts) => {}, []);

	const sendMessage = useCallback(
		async (pm, content, channel, userId, decIdentity) => {
			setPostStatus(FetchStatus.Loading);

			try {
				const contentPayload = content
					? [
							B_PREFIX, // B Prefix
							content,
							"text/plain",
							"utf-8",
						]
					: [];

				const filesPayload = pendingFilesOutputs
					? pendingFilesOutputs.flatMap((f, i) => (i === 0 ? f : ["|", ...f]))
					: [];

				const contentFilesSeparator =
					contentPayload.length > 0 && filesPayload.length > 0 ? ["|"] : [];

				/**
				 * Allow messages with optional text and files
				 */
				const bPayload = [
					...contentPayload,
					...contentFilesSeparator,
					...filesPayload,
				];

				const dataPayload = [
					...bPayload,
					"|",
					MAP_PREFIX, // MAP Prefix
					"SET",
					"app",
					"bitchatnitro.com",
					"type",
					"message",
				];

				// DMs do not have a paymail field for privacy
				if (!userId) {
					dataPayload.push("paymail", pm);
				}

				// add channel
				if (channel) {
					dataPayload.push("context", "channel", "channel", channel);
				} else if (userId) {
					dataPayload.push(
						"encrypted",
						"true", // TODO: Set to true when encryption is working
						"context",
						"bapID",
						"bapID",
						userId,
					);

					// const decIdentity = await hcDecrypt(identity);

					if (!decIdentity) {
						console.log("no ident info");
						return;
					}

					const { memberList } = storeAPI.getState();
					const { friendRequests } = memberList;
					console.log({ friendRequests });
					if (
						!(
							friendRequests.incoming.byId[userId] ||
							friendRequests.outgoing.byId[userId]
						) &&
						decIdentity?.bapId !== userId
					) {
						// TODO: Change when publicCommsKey is implemented
						console.log(
							"cant do this unless self!",
							friendRequests,
							userId,
							decIdentity,
						);
						return;
					}
					console.log(
						"trying to use public key from user",
						head(friendRequests.incoming.byId[userId]?.MAP).publicKey,
					);
					// const friendPublicKey =
					//   decIdentity?.bapId === userId
					//     ? friendPublicKeyFromSeedString("notes", decIdentity.xprv)
					//     : new bsv.PublicKey(
					//         friendRequests.incoming.byId[userId].MAP.publicKey
					//       );

					const friendPrivateKey = friendPrivateKeyFromSeedString(
						decIdentity?.bapId === userId ? "notes" : userId,
						decIdentity?.xprv,
					);

					// get the friend's public key
					const friendPubKey = head(
						friendRequests.incoming.byId[userId]?.MAP,
					).publicKey;

					console.log({
						f1: friendPrivateKey.publicKey.toString(),
						f2: friendPubKey,
					});
					// encrypt the content with shared ecies between the two identities
					dataPayload[1] = encrypt(
						dataPayload[1],
						friendPrivateKey,
						friendPubKey ? new bsv.PublicKey(friendPubKey) : undefined,
					);
					dataPayload[2] = "application/bitcoin-ecies; content-type=text/plain";
					dataPayload[3] = "binary";

					// lets make sure we can decrypt it too
				}

				const hexArray = dataPayload.map((d) =>
					Buffer.from(d, "utf8").toString("hex"),
				);

				if (userId && !decIdentity) {
					console.log("cant dm without identity");
					return;
				}

				// Send with Handcash
				if (authToken) {
					let signedOps;
					if (decIdentity) {
						// decrypt and import identity
						signedOps = await signOpReturnWithAIP(hexArray);

						// TODO: If this is a message to a person do we need to sign with a different key!?

						console.log({ signedOps });
					}

					const resp = await fetch(`${env.REACT_APP_API_URL}/hcSend/`, {
						method: "POST",
						headers: new Headers({ "Content-Type": "application/json" }),
						body: JSON.stringify({
							hexArray: signedOps || hexArray, // remove op_false op_return
							authToken,
							channel,
							userId,
						}),
					});

					const { paymentResult } = await resp.json();

					// reset pending files
					if (pendingFiles) {
						setPendingFiles([]);
					}
					console.log({ paymentResult });
					if (paymentResult?.rawTransactionHex) {
						try {
							const tx = await notifyIndexer(paymentResult.rawTransactionHex);
							console.log("dang dispatched new message", tx);
							tx.timestamp = moment().unix();
							dispatch(receiveNewMessage(tx));

							setPostStatus(FetchStatus.Success);
						} catch (e) {
							console.log("failed to notify indexer", e);
							setPostStatus(FetchStatus.Error);

							return;
						}
					}
					return;
				}

				// Send with yours
				if (pandaProfile && utxos) {
					let scriptP;

					try {
						if (decIdentity) {
							const signedOps = await signOpReturnWithAIP(hexArray);
							scriptP = Script.fromASM(`OP_0 OP_RETURN ${signedOps.join(" ")}`);
						} else {
							scriptP = Script.fromASM(
								`OP_0 OP_RETURN ${dataPayload
									.map((str) => bops.to(bops.from(str, "utf8"), "hex"))
									.join(" ")}`,
							);
						}
						const outputsP = [
							{ script: scriptP.toASM(), amount: 0, currency: "BSV" },
						];
						console.log("Making a youra tx", { outputsP, pandaProfile });

						//  sendBsv: (params: SendBsv[]) => Promise<string | undefined>;

						const { txid, rawtx } = await sendBsv([
							{
								script: scriptP.toHex(),
								satoshis: 0,
							},
						]);
						console.log({ txid });

						// let tx = new nimble.Transaction();

						// // add outputs
						// for (let output of outputsP) {
						//   tx = tx.output({
						//     script: output.script,
						//     satoshis: output.amount,
						//   });
						// }

						// let sigRequests = [];
						// for (let idx = 0; idx < utxos?.length; idx++) {
						//   const input = utxos[idx];
						//   tx = tx.input(
						//     new nimble.Transaction.Input(
						//       input.txid,
						//       input.vout,
						//       new nimble.Script(),
						//       0xffffffff,
						//       new nimble.Transaction.Output(
						//         nimble.Script.fromASM(input.script),
						//         input.satoshis
						//       )
						//     )
						//   );
						//   sigRequests.push({
						//     prevTxId: input.txid,
						//     outputIndex: input.vout,
						//     inputIndex: idx,
						//     satoshis: input.satoshis,
						//     address: pandaProfile.addresses.bsvAddress,
						//     scriptHex: nimble.Script.fromASM(input.script).toHex(),
						//   });
						// }

						// tx = tx.change(pandaProfile.addresses.bsvAddress);

						// const sigResponses = await getSignatures({
						//   txHex: tx.toString(),
						//   sigRequests,
						// });

						// console.log({ sigRequests, sigResponses });

						// // set scripts on inputs
						// for (let idx = 0; idx < sigResponses.length; idx++) {
						//   const sigResponse = sigResponses[idx];
						//   const input = tx.inputs[sigResponse.inputIndex];

						//   const asm = `${sigResponse.sig} ${sigResponse.publicKey}`;
						//   input.script = nimble.Script.fromASM(asm);
						//   tx.inputs[sigResponse.inputIndex] = input;
						// }

						// console.log({ rawTx: tx.toString() });
						// const r = await broadcast({ rawtx: tx.toString() });

						// console.log("made a tx to send to panda", { tx, r });

						const tx = await notifyIndexer(rawtx);
						console.log("indexer notified", { tx });
						setPostStatus(FetchStatus.Success);
						return;
					} catch (e) {
						console.log("sending message via panda wallet failed", e);
						setPostStatus(FetchStatus.Error);
						return;
					}
				}

				// Send with relay
				// let script;
				// if (decIdentity) {
				//   const signedOps = await signOpReturnWithAIP(hexArray);
				//   script = nimble.Script.fromASM(
				//     "OP_0 OP_RETURN " + signedOps.join(" ")
				//   );
				// } else {
				//   script = nimble.Script.fromASM(
				//     "OP_0 OP_RETURN " +
				//       dataPayload
				//         .map((str) => bops.to(bops.from(str, "utf8"), "hex"))
				//         .join(" ")
				//   );
				// }
				// let outputs = [{ script: script.toASM(), amount: 0, currency: "BSV" }];

				// console.log({ ready });
				// let resp = await relayOne.send({ outputs });
				// // reset pending files
				// if (pendingFiles) {
				//   setPendingFiles([]);
				// }
				// console.log("Sent message", resp);
				// // interface SendResult {
				// //   txid: string;
				// //   rawTx: string;
				// //   amount: number; // amount spent in button currency
				// //   currency: string; // button currency
				// //   satoshis: number; // amount spent in sats
				// //   paymail: string; // user paymail deprecated
				// //   identity: string; // user pki deprecated
				// // }
				// try {
				//   const tx = await notifyIndexer(resp.rawTx);
				//   console.log(`dang dispatched new message`, tx);
				//   tx.timestamp = moment().unix();
				//   setPostStatus(FetchStatus.Success);

				//   dispatch(receiveNewMessage(tx));
				// } catch (e) {
				//   console.log("failed to notify indexer", e);
				//   setPostStatus(FetchStatus.Error);

				//   return;
				// }
			} catch (e) {
				console.error(e);
			}
		},
		[
			broadcast,
			storeAPI,
			activeUserId,
			authToken,
			decIdentity,
			notifyIndexer,
			receiveNewMessage,
			dispatch,
			pandaProfile,
			utxos,
			sendBsv,
			pendingFiles,
			setPendingFiles,
			pendingFilesOutputs,
      signOpReturnWithAIP
		],
	);

	const likeMessage = useCallback(
		async (pm, contextName, contextValue, emoji) => {
			try {
				const dataPayload = [
					MAP_PREFIX, // MAP Prefix
					"SET",
					"app",
					"bitchatnitro.com",
					"type",
					"like",
					"context",
					contextName,
					contextName,
					contextValue,
					"paymail",
					pm,
				];

				// add channel
				if (emoji) {
					dataPayload.push("emoji", emoji);
				}

				// check for handcash token
				if (authToken) {
					const hexArray = dataPayload.map((str) =>
						bops.to(bops.from(str, "utf8"), "hex"),
					);
					// .join(" ")

					setLikeStatus(FetchStatus.Loading);

					const resp = await fetch(`${env.REACT_APP_API_URL}/hcSend/`, {
						method: "POST",
						headers: new Headers({ "Content-Type": "application/json" }),
						body: JSON.stringify({
							hexArray,
							authToken,
							channelId: activeChannelId,
						}),
					});
					const { paymentResult } = await resp.json();
					setLikeStatus(FetchStatus.Success);

					console.log({ paymentResult });
					if (paymentResult) {
						const tx = await notifyIndexer(paymentResult.rawTransactionHex);
						dispatch(receiveNewReaction(tx));
					}

					return;
					// https://bitchatnitro.com/hcsend/
					// { hexArray, authToken}
				}
				// const script = nimble.Script.fromASM(
				//   "OP_0 OP_RETURN " +
				//     dataPayload
				//       .map((str) => bops.to(bops.from(str, "utf8"), "hex"))
				//       .join(" ")
				// );
				// let outputs = [{ script: script.toASM(), amount: 0, currency: "BSV" }];

				// let resp = await relayOne.send({ outputs });

				// console.log("Sent", resp);
				// setLikeStatus(FetchStatus.Success);

				// const tx = await notifyIndexer(resp.rawTx);
				// dispatch(receiveNewReaction(tx));
				// let txid = resp.txid;
			} catch (e) {
				console.error(e);
				setLikeStatus(FetchStatus.Error);
			}
		},
		[dispatch, notifyIndexer, authToken, activeChannelId],
	);

	const self = useMemo(() => {
		return activeUserId && session.user?.bapId === activeUserId;
	}, [session, activeUserId]);

	const sendFriendRequest = useCallback(
		async (friendIdKey, xprv) => {
			if (decIdentity) {
				console.log("Can't make friend requests without identity");
				return;
			}
			//       MAP
			// SET app <appame>
			// type friend
			// idKey <idKey> - their id key
			// publicKey <publicKey> - the public key i generated for this interaction
			if (self) {
				console.log("cannot friend request self");
				return;
			}
			const publicFriendKey = friendPublicKeyFromSeedString(
				friendIdKey,
				xprv,
			).toString();

			// hdPrivateFriendKey.PrivateKey.from activeUser.idKey);
			// console.log({ publicFriendKey, friendIdKey });
			setFriendRequestStatus(FetchStatus.Loading);
			try {
				const dataPayload = [
					MAP_PREFIX, // MAP Prefix
					"SET",
					"app",
					"bitchatnitro.com",
					"type",
					"friend",
					"bapID",
					friendIdKey, // TODO: We don't have this until session provider resolves your ALIAS doc
					"publicKey",
					publicFriendKey,
				];

				const hexArray = dataPayload.map((str) =>
					bops.to(bops.from(str, "utf8"), "hex"),
				);
				if (authToken && decIdentity) {
					// console.log({ hexArray });
					// decrypt and import identity
					const signedOps = await signOpReturnWithAIP(hexArray);

					// console.log({ signedOps });
					const resp = await fetch(`${env.REACT_APP_API_URL}/hcSend/`, {
						method: "POST",
						headers: new Headers({ "Content-Type": "application/json" }),
						body: JSON.stringify({
							hexArray: signedOps, // remove op_false op_return
							authToken,
							userId: friendIdKey,
						}),
					});

					const { paymentResult } = await resp.json();
					setFriendRequestStatus(FetchStatus.Success);

					console.log({ paymentResult });
					if (paymentResult?.rawTransactionHex) {
						try {
							await notifyIndexer(paymentResult.rawTransactionHex);
						} catch (e) {
							console.log("failed to notify indexer", e);
							setFriendRequestStatus(FetchStatus.Error);

							return;
						}
					}

					return;
				}

				// check for handcash token
				// let authToken = localStorage.getItem("bitchat-nitro.hc-auth-token");
				if (authToken) {
					const hexArray = dataPayload.map((str) =>
						bops.to(bops.from(str, "utf8"), "hex"),
					);
					// .join(" ")

					const resp = await fetch(`${env.REACT_APP_API_URL}/hcSend/`, {
						method: "POST",
						headers: new Headers({ "Content-Type": "application/json" }),
						body: JSON.stringify({ hexArray, authToken, userId: friendIdKey }),
					});

					const { paymentResult } = await resp.json();
					console.log({ paymentResult });
					setFriendRequestStatus(FetchStatus.Success);

					await notifyIndexer(paymentResult.rawTransactionHex);
					return;
					// https://bitchatnitro.com/hcsend/
					// { hexArray, authToken}
				}
				// const script = nimble.Script.fromASM(
				//   "OP_0 OP_RETURN " +
				//     dataPayload
				//       .map((str) => bops.to(bops.from(str, "utf8"), "hex"))
				//       .join(" ")
				// );
				// let outputs = [{ script: script.toASM(), amount: 0, currency: "BSV" }];

				// let resp = await relayOne.send({ outputs });
				// setFriendRequestStatus(FetchStatus.Success);

				// console.log("Sent friend request", resp);
				// // interface SendResult {
				// //   txid: string;
				// //   rawTx: string;
				// //   amount: number; // amount spent in button currency
				// //   currency: string; // button currency
				// //   satoshis: number; // amount spent in sats
				// //   paymail: string; // user paymail deprecated
				// //   identity: string; // user pki deprecated
				// // }
				// try {
				//   await notifyIndexer(resp.rawTx);
				// } catch (e) {
				//   console.log("failed to notify indexer", e);
				//   return;
				// }
			} catch (e) {
				console.error(e);
				setFriendRequestStatus(FetchStatus.Error);
			}
		},
		[
			self,
			decIdentity,
			authToken,
			notifyIndexer,
			signOpReturnWithAIP,
		],
	);

	const value = useMemo(
		() => ({
			sendPin,
			pinStatus,
			sendFriendRequest,
			friendRequestStatus,
			sendMessage,
			postStatus,
			likeMessage,
			likeStatus,
			decryptStatus,
			signOpReturnWithAIP,
			signStatus,
			pendingFiles,
			setPendingFiles,
		}),
		[
			sendFriendRequest,
			friendRequestStatus,
			sendPin,
			pinStatus,
			sendMessage,
			postStatus,
			likeMessage,
			likeStatus,
			decryptStatus,
			signOpReturnWithAIP,
			signStatus,
			pendingFiles,
		],
	);

	return <BitcoinContext.Provider value={value} {...props} />;
};

const useBitcoin = () => {
	const context = useContext(BitcoinContext);
	if (context === undefined) {
		throw new Error("useBitcoin must be used within an BitcoinProvider");
	}
	return context;
};

export { BitcoinProvider, useBitcoin };

//
// Utils
//

const B_PREFIX = "19HxigV4QyBv3tHpQVcUEQyq1pzZVdoAut";
const AIP_PREFIX = "15PciHG22SNLQJXMoSUaWVi7WSqc7hCfva";
export const MAP_PREFIX = "1PuQa7K62MiKCtssSLKy1kh56WWU7MtUR5";

export const decrypt = (data, privateKey, publicKey) => {
	return publicKey
		? ECIES.decrypt(Buffer.from(data, "base64"), privateKey, publicKey)
		: ECIES.decrypt(Buffer.from(data, "base64"), privateKey);
};

export const encrypt = (data, privateKey, publicKey) => {
	console.log("encrypt", { data, privateKey, publicKey });
	if (publicKey) {
		return ECIES.encrypt(data, privateKey, publicKey);
	}
	return ECIES.encrypt(data, privateKey, privateKey.toPublicKey());
};

export const friendPublicKeyFromSeedString = (seedString, xprv) => {
	return friendPrivateKeyFromSeedString(seedString, xprv).toPublicKey();
};

export const friendPrivateKeyFromSeedString = (seedString, xprv) => {
	if (!xprv) {
		throw new Error("no xprv!");
	}
	// Generate a key based on the other users id hash
	const seedHex = Hash.sha256(Buffer.from(seedString)).toString("hex");
	const signingPath = getSigningPathFromHex(seedHex);

	// Note: Since @bsv/sdk doesn't have HD key support yet, we'll rely on bsv-bap's BAP class
	// to handle the HD key derivation. The BAP class should handle this internally.
	const bapInstance = new BAP(xprv);
	return bapInstance.derivePrivateKey(signingPath);
};
