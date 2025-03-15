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
}

// DNS记录信息
export interface DNSRecordInfo {
  name: string;
  type: string;
  class: string;
  ttl: number;
  data: string;
}

// DNS信息
export interface DNSInfo {
  queryId?: number;
  qr?: boolean;
  questions?: string[];
  responseCode?: number;
  recordTypes?: string[];
  answers?: DNSRecordInfo[];
}

// ICMP信息
export interface ICMPInfo {
  type: number;
  code: number;
  sequence?: number;
  id?: number;
}

// DHCP信息
export interface DHCPInfo {
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

// ES文件信息
export interface FileInfoEs {
  // 元数据
  id?: string;
  timestamp: string;
  captureIndex?: number;
  sourceFormat: string;
  sourceFile?: string;
  packetLength?: number;
  captureLength?: number;

  // 链路层
  linkType?: string;
  sourceMAC?: string;
  destinationMAC?: string;

  // 网络层
  networkProtocol?: string;
  sourceIP?: string;
  destinationIP?: string;
  ipVersion?: number;
  ttl?: number;

  // 传输层
  transportProtocol?: string;
  sourcePort?: number;
  destinationPort?: number;
  sequenceNumber?: number;
  acknowledgmentNum?: number;
  tcpFlags?: number;

  // 应用层
  applicationProtocol?: string;
  hostname?: string;
  uri?: string;
  httpMethod?: string;
  httpStatusCode?: number;
  httpVersion?: string;
  contentType?: string;
  contentLength?: number;

  // HTTP特有字段
  requestHeaders?: KeyValuePair[];
  responseHeaders?: KeyValuePair[];
  queryParameters?: KeyValuePair[];
  cookies?: KeyValuePair[];

  // 流量分析指标
  responseTime?: number;
  dnsResolutionTime?: number;
  tcpHandshakeTime?: number;

  // 安全相关
  tlsVersion?: string;
  tlsCipherSuite?: string;

  // 全文索引
  payloadSummary?: string;

  // 关联字段
  taskId?: string;
  fileId?: string;
  fileUuid?: string;

  // 流/会话追踪
  flowId?: string;
  conversationId?: string;
  relatedPackets?: string[];

  // VLAN和MPLS信息
  vlans?: number[];
  mpls?: number[];

  // 分片信息
  fragmentInfo?: FragmentInfo;

  // 协议特定数据
  dns?: DNSInfo;
  icmp?: ICMPInfo;
  dhcp?: DHCPInfo;
}

// ES文件列表请求
export interface FileInfoEsListReq extends PageInfo {
  taskId?: string;
  fileId?: string;
  fileUuid?: string;
  sortFields?: string[];

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
}

// ES文件列表响应
export interface FileInfoEsListResp {
  list?: FileInfoEs[];
  total: number;
}
