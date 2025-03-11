// 为process对象添加全局类型
interface Window {
  process?: {
    env: Record<string, any>;
    browser?: boolean;
    version?: string;
    platform?: string;
    nextTick?: (fn: Function) => void;
    [key: string]: any;
  };
} 
