import gmCrypt from "gm-crypt";

const pwdKey = "rmooO@RMwmkAuVb3";
const SM4 = gmCrypt.sm4;
const sm4Config = {
  key: pwdKey,
  mode: "ecb", // 加密的方式有两种，ecb和cbc两种，也是看后端如何定义的，不过要是cbc的话下面还要加一个iv的参数，ecb不用
  // iv: '1234567891011121', // iv是initialization vector的意思，就是加密的初始话矢量，初始化加密函数的变量，也叫初始向量。（本来应该动态生成的，由于项目没有严格的加密要求，直接写死一个）
  cipherType: "base64"
};
const sm4Util = new SM4(sm4Config);

export function encrypt(text) {
  return sm4Util.encrypt(text);
}

/**
 * 解密工具函数
 * @param {string} text 待解密密文
 */
export function decrypt(text) {
  return sm4Util.decrypt(text);
}
