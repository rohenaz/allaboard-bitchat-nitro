/**
 * Get a signing path from a hex number
 *
 * @param hexString {string}
 * @param hardened {boolean} Whether to return a hardened path
 * @returns {string}
 */
const getSigningPathFromHex = (hexString, hardened = true) => {
  // "m/0/0/1"
  let signingPath = 'm';
  const signingHex = hexString.match(/.{1,8}/g);
  const maxNumber = 2147483648 - 1; // 0x80000000
  if (signingHex) {
    for (const hexNumber of signingHex) {
      let number = Number(`0x${hexNumber}`);
      if (number > maxNumber) number -= maxNumber;
      signingPath += `/${number}${hardened ? "'" : ''}`;
    }
  }
  return signingPath;
};

export { getSigningPathFromHex };
