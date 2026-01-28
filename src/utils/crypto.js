import crypto from "crypto";
import CryptoJS from "crypto-js";

export const generateRSAKeys = () => {
  return crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,

    // ✅ MUST be spki
    publicKeyEncoding: {
      type: "spki",
      format: "pem",
    },

    // ✅ MUST be pkcs8
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
    },
  });
};

export const encryptPrivateKey = (privateKey, password) => {
  return CryptoJS.AES.encrypt(privateKey, password).toString();
};
