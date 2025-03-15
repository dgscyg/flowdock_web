// ES数据查询相关的类型定义

// 分页基础类型
export interface PageInfo {
  offset: number;
  length: number;
}

// 键值对类型
export interface KeyValuePair {
  name: string;
  value: string;
  comment?: string;
}

// DNS记录信息
export interface DNSRecord {
  name: string;
  type: string;
  class: string;
  ttl: number;
  data: string;
}

// DNS信息
export interface DNSData {
  queryId?: number;
  qr?: boolean;
  questions?: string[];
  responseCode?: number;
  recordTypes?: string[];
  answers?: DNSRecord[];
}

// ICMP信息
export interface ICMPData {
  type: number;
  code: number;
  sequence?: number;
  id?: number;
}

// DHCP信息
export interface DHCPData {
  messageType?: number;
  clientMAC?: string;
  yourIP?: string;
  serverIP?: string;
  requestedIP?: string;
  leaseTime?: number;
  dhcpServerName?: string;
}

// 分片信息
export interface FragmentInfo {
  isFragment: boolean;
  fragmentOffset?: number;
  moreFragments?: boolean;
  fragmentId?: number;
}

// Cookie信息
export interface Cookie {
  name: string;
  value: string;
  path?: string;
  domain?: string;
  expires?: string;
  httpOnly?: boolean;
  secure?: boolean;
  comment?: boolean;
}

// 请求发送的数据
export interface PostParam {
  name: string;
  value?: string;
  fileName?: string;
  contentType?: string;
  comment?: string;
}

export interface PostData {
  mimeType: string;
  params: PostParam[];
  text: string;
  comment?: string;
}

// 响应内容详情
export interface Content {
  size: number;
  compression?: number;
  mimeType: string;
  text?: string;
  encoding?: string;
  comment?: string;
  file?: string;
}

// HTTP请求
export interface Request {
  method: string;
  url: string;
  httpVersion: string;
  cookies: Cookie[];
  headers: KeyValuePair[];
  queryString: KeyValuePair[];
  postData: PostData;
  headerSize: number;
  bodySize: number;
  comment?: string;
}

// HTTP响应
export interface Response {
  status: number;
  statusText: string;
  httpVersion: string;
  cookies: Cookie[];
  headers: KeyValuePair[];
  content: Content;
  redirectURL: string;
  headersSize: number;
  bodySize: number;
  comment?: string;
}

// 缓存对象状态
export interface CacheObject {
  expires?: string;
  lastAccess: string;
  eTag: string;
  hitCount: number;
  comment?: string;
}

// 缓存信息
export interface Cache {
  beforeRequest?: CacheObject;
  afterRequest?: CacheObject;
  comment?: string;
}

// 详细时间分布
export interface PageTimings {
  blocked?: number;
  dns?: number;
  connect?: number;
  send: number;
  wait: number;
  receive: number;
  ssl?: number;
  comment?: string;
}

// 页面加载时间信息
export interface PageTiming {
  onContentLoad: number;
  onLoad: number;
  comment: string;
}

// HAR页面信息
export interface HARPage {
  startedDateTime: string;
  id: string;
  title: string;
  pageTiming: PageTiming;
  comment?: string;
}

// HAR特有数据
export interface HARData {
  pageRef?: string;
  page?: HARPage;
  request?: Request;
  response?: Response;
  startedDateTime?: string;
  time?: number;
  timings?: PageTimings;
  serverIPAddress?: string;
  connection?: string;
  cache?: Cache;
  comment?: string;
}

// PCAP特有数据
export interface PCAPData {
  packetLength?: number;
  captureLength?: number;
  rawData?: string;
  linkType?: string;
  sourceMAC?: string;
  destinationMAC?: string;
  networkProtocol?: string;
  sourceIP?: string;
  destinationIP?: string;
  ipVersion?: number;
  ttl?: number;
  transportProtocol?: string;
  sourcePort?: number;
  destinationPort?: number;
  sequenceNumber?: number;
  acknowledgmentNum?: number;
  tcpFlags?: number;
  vlans?: number[];
  mpls?: number[];
  fragmentInfo?: FragmentInfo;
}

// 通用数据包模型 - 替换旧的FileInfoEs
export interface PacketData {
  // 基础元数据
  id?: string;
  timestamp: string;
  captureIndex?: number;
  sourceFormat: string;
  sourceFile?: string;

  // 关联信息
  taskId?: string;
  fileId?: string;
  fileUuid?: string;
  flowId?: string;
  conversationId?: string;
  relatedPackets?: string[];

  // 应用层协议通用信息
  applicationProtocol?: string;
  tlsVersion?: string;
  tlsCipherSuite?: string;

  // 数据包具体内容
  pcap?: PCAPData;
  dns?: DNSData;
  icmp?: ICMPData;
  dhcp?: DHCPData;
  har?: HARData;
}

// 数据包查询请求参数
export interface PacketQueryReq extends PageInfo {
  taskId: string;
  fileId?: string;
  fileUuid?: string;
  
  // 时间范围
  startTime?: string;
  endTime?: string;
  
  // 协议过滤
  networkProtocol?: string;
  transportProtocol?: string;
  applicationProtocol?: string;
  
  // 网络地址过滤
  sourceIP?: string;
  destinationIP?: string;
  ip?: string;
  
  // MAC地址过滤
  sourceMAC?: string;
  destinationMAC?: string;
  
  // 端口过滤
  sourcePort?: number;
  destinationPort?: number;
  port?: number;
  
  // HTTP相关过滤
  hostname?: string;
  uri?: string;
  httpMethod?: string;
  httpStatusCode?: number;
  contentType?: string;
  
  // DNS相关过滤
  dnsDomain?: string;
  dnsRecordType?: string;
  
  // TLS相关过滤
  tlsVersion?: string;
  tlsCipherSuite?: string;
  
  // 流/会话过滤
  flowId?: string;
  conversationId?: string;
  
  // 全文搜索
  text?: string;
  
  // 排序
  sortAsc?: boolean;
  sortFields?: string[];
}

// 查询结果响应
export interface QueryResultResp {
  total: number;
  page: number;
  size: number;
  packets: PacketData[];
}

// 为了向后兼容，提供类型别名
export type FileInfoEs = PacketData;
export type FileInfoEsListReq = PacketQueryReq;
export type FileInfoEsListResp = {
  list?: PacketData[];
  total: number;
};
