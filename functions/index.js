const functions = require("firebase-functions");
const cors = require("cors-async")({ origin: true });
const bsv = require("bsv");
const { HandCashConnect } = require("@handcash/handcash-connect");
const handCashConnect = new HandCashConnect({
  appId: functions.config().handcash.app_id,
  appSecret: functions.config().handcash.app_secret,
});
const ECIES = require("bsv/ecies");

// functions.config().handcash.app_id
// functions.config().handcash.app_secret

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.hcLogin = functions.https.onRequest(async (req, res) => {
  await cors(req, res);
  // Use this field to redirect the user to the HandCash authorization screen.
  const redirectionLoginUrl = handCashConnect.getRedirectionUrl();
  return res.redirect(redirectionLoginUrl);
});

exports.hcEncrypt = functions.https.onRequest(async (req, res) => {
  await cors(req, res);

  if (!req.body.authToken) {
    return res.status(401).send();
  }

  if (!req.body.data) {
    return res.status(400).send();
  }
  const account = handCashConnect.getAccountFromAuthToken(req.body.authToken);
  const { privateKey } = await account.profile.getEncryptionKeypair();

  // encrypt
  const ecies = new ECIES();
  const publicKey = bsv.PrivateKey.fromWIF(privateKey).publicKey.toString();
  ecies.publicKey(publicKey);
  const b64encrypted = ecies
    .encrypt(JSON.stringify(req.body.data))
    .toString("base64");

  // ecies.privateKey(privateKey).decrypt
  return res.status(200).send({ encryptedData: b64encrypted });
});

exports.hcDecrypt = functions.https.onRequest(async (req, res) => {
  await cors(req, res);

  if (!req.body.authToken) {
    return res.status(401).send();
  }

  if (!req.body.encryptedData) {
    return res.status(400).send();
  }

  const account = handCashConnect.getAccountFromAuthToken(req.body.authToken);
  const { privateKey } = await account.profile.getEncryptionKeypair();

  // decrypt identity file
  const ecies = new ECIES();
  ecies.privateKey(bsv.PrivateKey.fromString(privateKey));
  const identityDec = ecies
    .decrypt(Buffer.from(req.body.encryptedData, "base64"))
    .toString();

  return res.status(200).send(JSON.parse(identityDec));

  // import ECIES from 'bsv/ecies';

  // ECIES().privateKey(privateKey).encrypt()

  // return res.status(200).send({});
});

exports.hcProfile = functions.https.onRequest(async (req, res) => {
  await cors(req, res);

  if (!req.body.authToken) {
    return res.status(401).send();
  }

  const account = handCashConnect.getAccountFromAuthToken(req.body.authToken);

  const currentProfile = await account.profile.getCurrentProfile();
  functions.logger.info({ currentProfile });

  // get public key from request
  // const { publicKey, privateKey } = handCashConnect.getEncryptionKeypair(req.body.publicKey);
  // identity = new BAP(identityDec.xprv);

  // if (identityDec.ids) {
  //   identity.importIds(identityDec.ids);
  // }

  const { publicProfile, privateProfile } = currentProfile;
  return res.status(200).send({ publicProfile, privateProfile });
});

exports.hcSendMessage = functions.https.onRequest(async (req, res) => {
  await cors(req, res);

  // const payment = {
  //   description: "Hold my beer!🍺",
  //   appAction: "drink",
  //   payments: [
  //     { to: "eyeone", currencyCode: "USD", amount: 0.25 },
  //     { to: "apagut", currencyCode: "EUR", amount: 0.05 },
  //     { to: "satoshi", currencyCode: "SAT", amount: 50000 },
  //   ],
  // };

  let hexArray = req.body.hexArray;
  let authToken = req.body.authToken;
  const account = handCashConnect.getAccountFromAuthToken(authToken);

  const payment = {
    description:
      req.body.description ||
      `Message in ${
        req.body.channelId ? "#" + req.body.channelId : "global chat"
      }`,
    appAction: "data",
    attachment: { format: "hexArray", value: hexArray },
  };

  try {
    const paymentResult = await account.wallet.pay(payment);
    functions.logger.info("Payment complete:", { paymentResult });
    return res.send({ paymentResult });
  } catch (e) {
    return res.status(500).send(e);
  }
});

// Name: /hcwebhook
// Method: GET
// Description: Webhook triggers when faucet handcash payment is complete
// Returns: 200 on Success
exports.hcwebhook = functions.https.onRequest(async (req, res) => {
  // moneybutton sends
  // { secret, payment }
  // let cors = handleCors(req, res)
  console.log("webhook from handcash", req.body);
  // req.body.payment
  // if (req.body.secret === functions.config().moneybutton.webhook_secret) {
  //   if (!req.body.payment || !req.body.payment.buttonData) {
  //     // Webhook for user without a tncpw_session
  //     console.log("no buttonData");
  //     return res.status(200).send("");
  //   }

  //   let buttonData = JSON.parse(req.body.payment.buttonData);
  //   if (
  //     !buttonData.tncpw_session ||
  //     buttonData.tncpw_session === "" ||
  //     buttonData.tncpw_session === "null"
  //   ) {
  //     console.log("no tncpw_session");
  //     return res.status(200).send("");
  //   }

  //   // Validate amount is exactly $0.11
  //   let amount = Number(parseFloat(req.body.payment.amount).toFixed(2));
  //   if (amount !== 0.11) {
  //     console.log("wrong amount");
  //     return res.status(200).send("");
  //   }

  //   let sessionID = buttonData.tncpw_session;
  //   try {
  //     // let response = await apiRequest(cors.req, '/tap')
  //     let response = await tonicpow.api.triggerConversion(sessionID, "donate");
  //     console.log("triggered conversion:", response);
  //     return res.status(200).send("");
  //   } catch (error) {
  //     console.error("error", error);
  //     return res.status(error.statusCode).send(error.error);
  //   }
  // }
  // Bad secret
  // return res.status(401).send("");
  return res.status(200).send("");

  // https://bitchatnitro.com/hcwebhook
});
