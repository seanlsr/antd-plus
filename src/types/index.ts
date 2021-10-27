
/**
 * 支持快捷关键字搜索类型
 */
export declare type  SupportQuickSearchType = {
  keywordType_: string,
  keyword_: string
};

/**
 * 页面打开方式
 */
export declare type OpenDisplayType = 'drawer' | 'modal' | 'open' | 'none';

export interface DataRequestType {
  url: string;
  params?: object;
}

/**
 * 一般用于定义树对象的访问字段名
 */
export interface DataNamesType {
  id?: string;
  name?: string;
  children?: string;
  parent?: string;
  level?: string
}

/**
 * 约定的访问名称，用于构建URI
 */
export declare type PagePathType = 'index'|'list'|'page'|'show'|'input'|'create'|'load'|'edit'|'del'|'enabled'|'lookup'|'select'|'check'|'export'|'inport';

export interface PageActionType<INFO> {
  key: string; // key一组按钮中唯一
  name: string; // 操作按钮文字
  dropdown?: boolean; // 是否下拉菜单方式
  onHandle?: (record:INFO)=>void; // 操作回调，传入行记录
}

export declare type LoaderType = 'MANY_TO_ONE'|'ITEM'|'DICT'|'ENUM';

export declare type SupportSchemaLoader = {
  loader?: SchemaLoaderType
}

/**
 * 扩展schema，用于定义远程加载对象
 */
export interface SchemaLoaderType {
  type: LoaderType;
  code: string;
  preload: boolean;
  level?: number;
  multiple?: boolean;
  multipleMax?: number;
  separator?: string;
  options?: string[];
  idKey?: string;
  nameKey?: string;
  inputType?: string;
}

export declare namespace API {
  type CurrentUser = {
    fullName?: string;
    userName: string;
    avatar?: string;
    userId?: string;
    email?: string;
    signature?: string;
    title?: string;
    group?: string;
    tags?: { key?: string; label?: string }[];
    notifyCount?: number;
    unreadCount?: number;
    country?: string;
    access?: string;
    geographic?: {
      province?: { label?: string; key?: string };
      city?: { label?: string; key?: string };
    };
    address?: string;
    phone?: string;
  };

  type LoginResult = {
    status?: string;
    type?: string;
    currentAuthority?: string;
  };

  type PageParams = {
    current?: number;
    pageSize?: number;
  };

  type RuleListItem = {
    key?: number;
    disabled?: boolean;
    href?: string;
    avatar?: string;
    name?: string;
    owner?: string;
    desc?: string;
    callNo?: number;
    status?: number;
    updatedAt?: string;
    createdAt?: string;
    progress?: number;
  };

  type RuleList = {
    data?: RuleListItem[];
    /** 列表的内容总数 */
    total?: number;
    success?: boolean;
  };

  type FakeCaptcha = {
    code?: number;
    status?: string;
  };

  type LoginParams = {
    loginName?: string;
    password?: string;
    autoLogin?: boolean;
    type?: string;
  };

  type ErrorResponse = {
    /** 业务约定的错误码 */
    errorCode: string;
    /** 业务上的错误信息 */
    errorMessage?: string;
    /** 业务上的请求是否成功 */
    success?: boolean;
  };

  type NoticeIconList = {
    data?: NoticeIconItem[];
    /** 列表的内容总数 */
    total?: number;
    success?: boolean;
  };

  type NoticeIconItemType = 'notification' | 'message' | 'event';

  type NoticeIconItem = {
    id?: string;
    extra?: string;
    key?: string;
    read?: boolean;
    avatar?: string;
    title?: string;
    status?: string;
    datetime?: string;
    description?: string;
    type?: NoticeIconItemType;
  };
}
