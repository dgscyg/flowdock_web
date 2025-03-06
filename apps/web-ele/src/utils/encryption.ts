import CryptoJS from 'crypto-js';
import JSEncrypt from 'jsencrypt';
import { Base64 } from 'js-base64';

// 配置信息
const PROJECT_ENCRYPT_CODE = "NTYyYjMyZmEyNmQ4M2ZlMjkzOGNhNzJkYTQ1Yzg4MGU="; // 项目加密密钥
const PUBLIC_KEY = `-----BEGIN RSA PUBLIC KEY-----
MEgCQQCW6pJLMkY67B53XiWqW8KnCPLhqVaVvtZhfROUW8vcoTjJatzwIEJFiQsXt8MtL7AQgbjdyceKXZjL5cW60PZXAgMBAAE=
-----END RSA PUBLIC KEY-----`; // RSA公钥

// 创建JSEncrypt实例，指定512位密钥大小
const encryptor = new JSEncrypt({ default_key_size: "512" });
encryptor.setPublicKey(PUBLIC_KEY);

/**
 * 深度克隆对象
 * 用于确保对象的完全复制，避免引用问题
 */
export function cloneDeep<T>(data: T): T {
  if (data === undefined || data === null) {
    return data;
  }
  return JSON.parse(JSON.stringify(data));
}

/**
 * 编码emoji字符
 * 将Unicode代理对编码为HTML实体形式，防止传输和加密过程中的字符集问题
 */
export function emojiEncode(inputStr: string): string {
  if (!inputStr) {
    return inputStr;
  }
  let emojiPattern = /[\ud800-\udbff][\udc00-\udfff]/g;
  return inputStr.replace(emojiPattern, function(match) {
    let highSurrogate, lowSurrogate;
    if (match.length === 2) {
      highSurrogate = match.charCodeAt(0);
      lowSurrogate = match.charCodeAt(1);
      return "&#" + ((highSurrogate - 55296) * 1024 + 65536 + lowSurrogate - 56320) + ";";
    } else {
      return match;
    }
  });
}

/**
 * 将对象转换为字符串
 * 根据指定分隔符将对象键值对转换为字符串形式
 * @param obj 要转换的对象
 * @param delimiter 分隔符，默认为';'
 * @param includeKeys 是否包含键名，默认为true
 */
export function objectToString(
  obj: Record<string, any>,
  delimiter = ';',
  includeKeys = true
): string {
  if (!obj) return '';
  
  const pairs = Object.keys(obj).map(key => {
    return includeKeys ? `${key}=${obj[key]}` : `${obj[key]}`;
  });
  
  return pairs.join(delimiter);
}

/**
 * RSA加密数据，支持长消息分块加密
 * 由于RSA加密受密钥长度限制，需要对长消息进行分块处理
 * @param data 要加密的数据
 */
export function rsaEncrypt(data: string): string {
  try {
    const encodedData = emojiEncode(data);
    const textEncoder = new TextEncoder();
    const MAX_CHUNK_SIZE = 53;  // 512位RSA密钥最多能加密约53字节
    let chunkStr = '';
    let encryptedChunks: Uint8Array[] = [];
    for (const char of encodedData) {
      const temp = chunkStr + char;
      const tempBytes = textEncoder.encode(temp);
      if (tempBytes.length > MAX_CHUNK_SIZE) {
        // 当前chunkStr已达上限，加密它
        const base64EncryptedChunk = encryptor.encrypt(chunkStr);
        if (base64EncryptedChunk === false) {
          throw new Error(`加密块失败: ${chunkStr}`);
        }
        const binaryChunk = Base64.toUint8Array(base64EncryptedChunk);
        encryptedChunks.push(binaryChunk);
        chunkStr = char; // 新chunk以当前字符开始
      } else {
        chunkStr = temp;
      }
    }
    if (chunkStr) {
      const base64EncryptedChunk = encryptor.encrypt(chunkStr);
      if (base64EncryptedChunk === false) {
        throw new Error(`加密块失败: ${chunkStr}`);
      }
      const binaryChunk = Base64.toUint8Array(base64EncryptedChunk);
      encryptedChunks.push(binaryChunk);
    }
    // 合并所有加密块
    const totalLength = encryptedChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combinedArray = new Uint8Array(totalLength);
    let position = 0;
    for (const chunk of encryptedChunks) {
      combinedArray.set(chunk, position);
      position += chunk.length;
    }
    return Base64.fromUint8Array(combinedArray);
  } catch (e) {
    console.error('RSA加密错误:', e);
    console.error('尝试加密的数据:', data);
    console.error('数据长度:', new TextEncoder().encode(data).length, '字节');
    throw e;
  }
}

/**
 * 生成加密的项目密钥
 * 构建包含类型、密钥和时间戳的信息，并进行RSA加密
 * @param timestamp 时间戳
 */
export function generateProjectKey(timestamp: number): string {
  const keyData = {
    type: 0,  // 使用数字，非字符串
    key: Base64.encode(PROJECT_ENCRYPT_CODE),
    time: timestamp
  };
  
  const keyString = objectToString(keyData);
  return rsaEncrypt(keyString);
}

/**
 * 将参数转换为URL编码的查询字符串
 * 匹配Python中urlencode的实现
 * @param params 参数对象
 */
export function paramsToQueryString(params: Record<string, any>): string {
  if (!params) {
    return '';
  }
  
  return new URLSearchParams(
    Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : String(v)])
  ).toString();
}

/**
 * 生成请求签名
 * 对请求信息进行哈希和签名处理
 * @param signData 包含时间戳、方法、路径等信息的对象
 */
export function generateSignature(signData: {
  timestamp: string | number;
  method: string;
  path: string;
  query: string;
  bodySign: string;
}): string {
  const clonedData = cloneDeep(signData);
  
  // 对于GET请求，bodySign可能为空字符串
  if (clonedData.bodySign && clonedData.bodySign.length > 0) {
    // 直接使用原始bodySign，不添加引号
    const bodyBytes = new TextEncoder().encode(signData.bodySign);
    const wordArray = CryptoJS.lib.WordArray.create(bodyBytes);
    clonedData.bodySign = CryptoJS.SHA256(wordArray).toString().toLowerCase();
  } else {
    // 对于GET请求，使用空字符串的哈希
    clonedData.bodySign = CryptoJS.SHA256('').toString().toLowerCase();
  }
  
  // 使用反引号换行作为分隔符
  const hmacString = objectToString(clonedData, `\n`, false);
  
  const hmacResult = CryptoJS.HmacSHA256(hmacString, PROJECT_ENCRYPT_CODE);
  return CryptoJS.enc.Base64.stringify(hmacResult);
}

/**
 * 生成请求的加密配置
 * 处理请求数据的加密和签名，为请求添加安全头信息
 * @param requestConfig 请求配置对象
 */
export function getEncryptConfig(requestConfig: {
  method: string;
  url?: string;
  path?: string;
  params?: Record<string, any>;
  data?: any;
  headers?: Record<string, any>;
  header?: Record<string, any>;
}) {
  const clonedConfig = cloneDeep(requestConfig);
  const timestamp = Math.floor(Date.now() / 1000);
  const encryptedKey = generateProjectKey(timestamp);
  
  const requestMethod = clonedConfig.method.toLowerCase() === "post" ? "POST" : "GET";
  
  let queryString = "";  // 查询参数字符串
  let encryptedBody = "";  // 加密的请求体
  
  if (requestMethod === "GET") {
    // 对于GET请求，正确格式化参数
    queryString = paramsToQueryString(clonedConfig.params || {});
    // 对于GET请求，加密体应为空字符串
    encryptedBody = "";
  } else {
    // 对于POST请求，正确处理数据
    const requestData = clonedConfig.data !== undefined ? cloneDeep(clonedConfig.data) : {}; 
    const jsonData = JSON.stringify(requestData);
    encryptedBody = rsaEncrypt(jsonData);
  }
  
  // 构造签名数据对象
  const signatureData = {
    timestamp: timestamp,
    method: clonedConfig.method.toLocaleUpperCase(),
    path: clonedConfig.url || clonedConfig.path || "",
    query: queryString,
    bodySign: encryptedBody
  };

  // 生成签名
  const signature = generateSignature(signatureData);
  
  // 生成安全头信息
  const securityHeader = objectToString({
    key: PROJECT_ENCRYPT_CODE,
    secret: encryptedKey,
    signature: signature
  });
  
  // 处理请求头 - 同时兼容header和headers
  const headers = clonedConfig.headers || clonedConfig.header || {};
  headers["X-Content-Security"] = securityHeader;
  headers["content-type"] = "application/json";
  
  if (clonedConfig.headers) {
    clonedConfig.headers = headers;
  } else {
    clonedConfig.header = headers;
  }
  
  // 为POST请求设置加密数据
  if (requestMethod === "POST") {
    clonedConfig.data = encryptedBody;
  }
  
  return clonedConfig;
}
