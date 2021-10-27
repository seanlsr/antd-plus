import {extend, ResponseError} from "umi-request";
import {API_ADDRESS, LOGIN_URL, WELCOME_URL} from "../../env/EnvVariableConfiguration";
import {DataNamesType, DataRequestType} from "../../types";
import {ProFieldValueType, RequestOptionsType} from "@ant-design/pro-utils/lib/typing";
import {SortOrder} from "antd/lib/table/interface";
import {RequestData} from "@ant-design/pro-descriptions/lib/useFetchData";
import {FormColumns, PageColumns} from "../../hooks/usePageModel";
import {CascaderOptionType} from "antd/lib/cascader";
import {DataNode} from "rc-tree/lib/interface";
import {RequestData as Records} from "@ant-design/pro-table";
import {processLoader} from "../../provider/FormProvider";
import {MenuDataItem} from "@ant-design/pro-layout";
// @ts-ignore
import {dynamic, history, IRoute} from "umi";
import {ApiResp, PageInfo} from "./ServiceTypes";
import LoadingComponent from "@ant-design/pro-layout/es/PageLoading";
import {notification} from "antd";

const request = extend({
    prefix: API_ADDRESS,
    // suffix: '',
    timeout: 10000,
    credentials: 'include', // 始终发送包含凭据的请求（即使是跨域源）
    headers: {
        viewtype: 'react'
    },
    errorHandler: (error: ResponseError) => {
        console.error(error);

        const {response} = error;

        if (response && response.status) {
            const {status, statusText, url} = response;

            if (response.status === 301) {
                notification.error({
                    message: '登录会话超时，请重新登录',
                });
                // 跳到登录
                history.push(LOGIN_URL);
                return;
            }

            notification.error({
                message: '网络超时，请重试',
            });
        }

        if (!response) {
            notification.error({
                description: '您的网络发生异常，无法连接服务器',
                message: '网络异常',
            });
        }
        throw error;
    }
});

/**
 * 登录
 * @param body
 * @param options
 */
export async function loginRequest(body: {
    loginName?: string;
    password?: string;
}, options?: { [key: string]: any }) {
    return request<ApiResp>('/login_json', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        params: body,
        ...(options || {}),
    });
}

/**
 * 获取当前登录用户
 * @param options
 */
export async function currentAdminRequest(options?: { [key: string]: any }) {
    return request<any>('/common/currentAdmin', {
        method: 'POST',
        ...(options || {}),
    });
}

/**
 * 选项数据加载
 */
export const selectRequest = <U extends object/*请求参数*/>(dataRequest: DataRequestType, dataNames?: DataNamesType) => {
    return async (
        params: U,
        props: any): Promise<RequestOptionsType[]> => {

        const resp: [] = await request<[]>(dataRequest.url,
            {
                method: 'post',
                params: {...params, ...dataRequest.params},
            });

        // TODO 缓存实现

        //console.log('----------select -> ' + JSON.stringify(data));

        let records: RequestOptionsType[] = [];
        if (resp) {
            resp.forEach((row) => {

                if (typeof row === 'string') {
                    records.push({
                        label: row,
                        value: row
                    });
                } else {
                    records.push({
                        label: Reflect.get(row, dataNames?.name || 'name'),
                        value: Reflect.get(row, dataNames?.id || 'id')
                    });
                }
            })
        }

        return records;
    }
}


/**
 * 请求分页数据
 * @param url 业务URL  如：/admin/page
 */
export const pageRequest = <T/*返回对象类型*/>(url: string) => {

    return async (
        params?: {
            pageSize?: number;
            current?: number;
            keyword?: string;
        },
        sort?: Record<string, SortOrder>,
        filter?: Record<string, React.ReactText[]>): Promise<Partial<Records<T>>> => {

        // 构建排序字段，提交到参数名 orderBy 和 orderType
        const orderBy: string[] = [];
        const orderType: string[] = [];
        if (sort) {
            for (let s in sort) {
                orderBy.push(s);
                orderType.push(sort[s] === 'ascend' ? 'asc' : 'desc');
            }
        }

        // 构建表头过滤
        if (filter) {
            for (let key in filter) {
                let filterValues = '';
                let value = filter[key];
                if (value) {
                    const valueArr: [] = value as [];
                    valueArr.map((value => {
                        filterValues += value + '#';
                    }))
                    filterValues = filterValues.substring(0, filterValues.length - 1);

                    // @ts-ignore
                    params = {...params, filterKeys: key, filterValues: filterValues};
                    console.log(key + '->' + value);
                }
            }
        }

        const resp: PageInfo<T> = await request<PageInfo<T>>(url,
            {
                method: 'post',
                params: {
                    // 转换分页查询参数名
                    queryPage: params?.current,
                    querySize: params?.pageSize,
                    orderBy: orderBy,
                    orderType: orderType,
                    ...replacePageParams(params)
                },
                // TODO JSessionID每次会变化
                //credentials: "same-origin"
            });

        return {
            // 转换分页结果对象
            data: resp.records,
            total: resp.total,
            success: true,
            t: 'test'
        }
    }
}

/**
 * 数据加载
 * @param url
 * @param id
 * @param idKey
 */
export const loadRequest = <T>(url: string, id: any, idKey?: string) => {

    console.log('url->' + url + ',id->' + id)

    return async (params: Record<string, any>): Promise<RequestData> => {
        const resp: PageInfo<T> = await request<PageInfo<T>>(url,
            {
                method: 'post',
                params: {[idKey || 'id']: id, querySize: 1},
            });
        const data = resp.records[0];

        return Promise.resolve({
            success: true,
            data: data
        });
    }
}

/**
 * 数据加载
 * @param url
 * @param id
 * @param idKey
 */
export const loadRecordRequest = async <T>(url: string, id: any, idKey?: string): Promise<T> => {

    console.log('url->' + url + ',id->' + id)

    const resp: PageInfo<T> = await request<PageInfo<T>>(url,
        {
            method: 'post',
            params: {[idKey || 'id']: id, querySize: 1},
        });
    return resp.records[0];
}

/**
 * 查询schema加载
 * @param url
 * @param customColumns
 */
export const loadQuerySchema = async <T>(url: string, customColumns?: PageColumns<T>[]): Promise<PageColumns<T>[]> => {

    let resp: PageColumns<T>[] = await request<PageColumns<T>[]>(url,
        {
            method: 'POST',
            params: {schema_: 'true'},
            mode: 'cors',
            // useCache: true,
            // ttl: 60000,
            // validateCache: (url, options) => { // @ts-ignore
            //   return options.method.toLowerCase() === 'get' },
        });

    if (!Array.isArray(resp)) {
        console.info(`【${url}】-> schema not find`)
        resp = [];
    }

    // 合并替换自定义列
    if (customColumns && customColumns.length > 0) {
        customColumns.map((customColumn) => {

            let findColumn
            resp.map((rc) => {
                if (rc.key === customColumn.key) {
                    findColumn = rc;
                }
            })

            if (findColumn) {
                findColumn = Object.assign(findColumn, customColumn);
            } else {
                resp.push(customColumn);
            }
        })
    }

    // @ts-ignore
    processLoader(resp);

    resp = resp.sort((c1, c2) => {
        // 按order重新排序，因为可能会有本地定义的字段，会按order穿插进来
        if ((c1.index || 0) > (c2.index || 0)) {
            return 1;
        } else {
            return -1;
        }
    })

    return resp;
}

/**
 * 字段默认宽度
 */
const formFieldWidth: Map<ProFieldValueType, any>
    = new Map<ProFieldValueType, any>([
    ['money', 100],
    ['percent', 100],
    ['digit', 100],
    ['radio', 'l'],
    ['checkbox', 'l'],
    ['date', 's'],
    ['select', 's']
])

/**
 * 获取表单schema
 * @param url   表单操作请求URL
 * @param customColumns  本地定义的字段，将会和远程的合并和替换
 */
export const loadFormSchema = async <T>(url: string, customColumns?: FormColumns<T>[] | undefined): Promise<FormColumns<T>[]> => {

    let resp: FormColumns<T>[] = await request<FormColumns<T>[]>(url,
        {
            method: 'GET',
            // headers: {schema_: 'true'},
            params: {schema_: 'true'},
            // useCache: true,
            // ttl: 60000,
            // validateCache: (url, options) => { // @ts-ignore
            //   return options.method.toLowerCase() === 'get' },
        });

    if (!Array.isArray(resp)) {
        console.info(`【${url}】-> schema not find`)
        resp = [];
    }

    // 合并替换自定义列
    if (customColumns && customColumns.length > 0) {
        customColumns.map((customColumn) => {

            let findColumn
            resp.map((rc) => {
                if (rc.key === customColumn.key) {
                    findColumn = rc;
                }
            })

            if (findColumn) {
                findColumn = Object.assign(findColumn, customColumn);
            } else {
                resp.push(customColumn);
            }
        })
    }

    // @ts-ignore
    processLoader(resp);

    if (resp) {
        resp = resp.sort((c1, c2) => {
            // 按order重新排序，因为可能会有本地定义的字段，会按order穿插进来
            if ((c1.order || 0) > (c2.order || 0)) {
                return 1;
            } else {
                return -1;
            }
        })

        let i: number = resp.length;
        resp.map((item => {
            const valueType = Reflect.get(item, 'valueType');
            const width = formFieldWidth.get(valueType) || 'm';
            if (Object.keys(item).indexOf('width') === -1) {
                Reflect.set(item, 'width', width);
            }

            // 去除order属性，将按数组排序顺序展示（因为antd pro的bug，会倒序展示）
            Reflect.deleteProperty(item, 'order');
            //Reflect.set(item, 'order', i--);
        }))
    }

    console.log('=================================[' + url + '] 合并后的 schema ->> 在下一行查看 ');
    console.log(resp);

    return resp;
}

// 级联数据请求
export const cascaderRequest = async (dataRequest: DataRequestType, dataNames?: DataNamesType, level?: number): Promise<CascaderOptionType[]> => {

    const resp: [] = await request<[]>(dataRequest.url,
        {
            method: 'post',
            params: dataRequest.params
        });

    let records: CascaderOptionType[] = [];

    if (resp && resp.length > 0) {
        resp.map((row) => {
            records.push(cascaderOptionTransfer(row, dataNames, level))
        });
    }

    return records;
}

export const cascaderOptionTransfer = (obj: any, dataNames?: DataNamesType, maxLevel?: number): CascaderOptionType => {

    const {level, icon} = obj;

    const isLeaf = level && maxLevel ? parseInt(level) >= maxLevel : false;

    const rowChildren: [] = Reflect.get(obj, dataNames?.children || 'children');
    let children: CascaderOptionType[] | undefined = undefined;
    if (rowChildren) {
        children = [];
        rowChildren.map((childObj) => {
            children?.push(cascaderOptionTransfer(childObj, dataNames, maxLevel));
        });
    }

    return {
        value: Reflect.get(obj, dataNames?.id || 'id'),
        label: Reflect.get(obj, dataNames?.name || 'name'),
        icon: icon,
        children: children,
        level: level,
        isLeaf: isLeaf
    }
}

// 树数据请求
export const treeRequest = async (dataRequest: DataRequestType, dataNames?: DataNamesType, level?: number,): Promise<DataNode[]> => {

    const resp: [] = await request<[]>(dataRequest.url,
        {
            method: 'post',
            params: dataRequest.params
        });

    let records: DataNode[] = [];

    if (resp && resp.length > 0) {
        resp.map((row) => {
            records.push(dataNodeTransfer(row, dataNames, level))
        });
    }

    return records;
}

// 表单提交请求
export const formSubmitRequest = async <T extends object>(url: string, evt: T): Promise<ApiResp> => {

    // @ts-ignore
    const resp: ApiResp = await request<ApiResp>(url,
        {
            method: 'post',
            params: evt,
        });

    console.log('[' + url + '][evt=' + JSON.stringify(evt) + ']->' + JSON.stringify(resp));

    return resp;
}

export const dataNodeTransfer = (obj: any, dataNames?: DataNamesType, maxLevel?: number): DataNode => {
    const {level, icon} = obj;
    const isLeaf = level && maxLevel ? parseInt(level) >= maxLevel : false;

    const rowChildren: [] = Reflect.get(obj, dataNames?.children || 'children');
    let children: DataNode[] | undefined = undefined;
    if (rowChildren) {
        children = [];
        rowChildren.map((childObj) => {
            children?.push(dataNodeTransfer(childObj, dataNames, maxLevel));
        });
    }
    return {
        key: Reflect.get(obj, dataNames?.id || 'id'),
        title: Reflect.get(obj, dataNames?.name || 'name'),
        icon: icon,
        children: children,
        isLeaf: isLeaf
    }
}

/**
 * 删除记录
 * @param url
 * @param ids
 * @param idsKey
 */
export const delRequest = (url: string, ids: (number | string)[], idsKey?: string): Promise<ApiResp> => {
    console.log('url->' + url + ',[' + (idsKey || 'ids') + ']->' + ids)
    return request<ApiResp>(url,
        {
            method: 'post',
            params: {[idsKey || 'ids']: ids},
        });
}

export const replacePageParams = <T/*返回对象类型*/>(params: any): any => {
    //console.log('params->' + JSON.stringify(params));

    const keys = Object.keys(params);

    // 快捷关键字搜索
    const hasKeywordSearch = keys.includes('keyword_') && keys.includes('keywordType_');
    if (hasKeywordSearch) {
        const {keywordType_, keyword_} = params;
        if (keyword_ && keyword_ !== '' && keywordType_ && keywordType_ !== '') {
            params = {...params, [keywordType_]: keyword_}
            Reflect.deleteProperty(params, 'keywordType_');
            Reflect.deleteProperty(params, 'keyword_');
        }
    }

    // Range类型参数转换为 minXXX maxXXX
    keys.map((key) => {
        if (key.endsWith('Range')) {
            const value = Reflect.get(params, key);
            if (value) {
                let values = [...value];
                if (values && values.length > 0) {
                    let endName = key.substr(0, 1).toUpperCase() + key.substr(1, key.length - 5 - 1);
                    params = {...params, ['min' + endName]: values[0]}

                    if (values.length > 1) {
                        params = {...params, ['max' + endName]: values[1]}
                    }

                    Reflect.deleteProperty(params, key);
                }
            }
        }
    });

    console.log('submit params->' + JSON.stringify(params));
    return params;
}


/**
 * 退出请求
 */
export const requestLogout = async (): Promise<ApiResp> => {
    return await request<ApiResp>('/logout', {
        method: 'POST'
    });
}

/**
 * 获取服务端路由
 */
export const requestRoutes = (): Promise<IRoute[]> => {
    return request<IRoute[]>('/routes', {
        method: 'POST'
    });
}

export const menuTransfer = (menuItem: any): MenuDataItem => {
    const {children, disabled, enabled, id, pathIds, url, name, icon} = menuItem;

    return {
        key: `${id}`,
        parentKeys: pathIds,
        path: url.endsWith('/index') ? `/${url.substring(0, url.lastIndexOf('/'))}` : `/${url}`,
        name,
        icon: icon?.startsWith('ico-system') ? 'icon-shoucang1' : icon,
        children: children?.map(menuTransfer),
        hideInMenu: enabled === false,
        disabled: disabled === true,
        hideInBreadcrumb: true,
    }
}

/**
 * 获取菜单
 * @param params
 * @param defaultMenuData
 */
export const requestMenus = async (params: Record<string, any>, defaultMenuData: MenuDataItem[]) => {

    const resp: [] = await request<[]>('/common/menus',
        {
            method: 'post',
            params
        });
    let records: MenuDataItem[] = [];
    if (resp && resp.length > 0) {
        resp.map((row) => {
            return records.push(menuTransfer(row))
        });
    }

    if (defaultMenuData && defaultMenuData.length > 0) {
        if (records.length === 1) {
            // @ts-ignore
            records[0].children = [...defaultMenuData, ...records[0].children];
        } else {
            records = [...defaultMenuData, ...records];
        }
    }

    return Promise.resolve(records);
}

/**
 * 获取配置项
 */
export const requestConfigs = async () => {
    return await request<Map<string, string>>('/common/config',
        {
            method: 'post',
        });
}

/**
 * 按目录约定的路由，如果没有匹配到的，刚指向这个增删改查的通用组件
 * @param routes 约定路由或配置路由
 * @param loadRoutes 服务端动态路由
 */
export const mergeRoute = (routes: IRoute[], loadRoutes: IRoute[], loadLogin: any, loadDynamic: (action: string) => any) => {

    loadRoutes?.map((loadRoute: IRoute) => {
        let findIndex = routes[0].routes?.findIndex(r => r.path === loadRoute.path) || -1;
        const hasExists: boolean = findIndex > 0;

        if (hasExists) {
            // 设置组件
            loadRoute.component = routes[0].routes?.[findIndex].component;
            // 替换路由
            routes[0].routes?.splice(findIndex, 1, loadRoute);
        } else {
            // 设置到动态组件
            const action: string = loadRoute.path?.substr(loadRoute.path?.lastIndexOf('/') + 1) || '';
            loadRoute.component = dynamic({
                loader: () => loadDynamic(action),
                loading: LoadingComponent
            });
            // 增加路由
            routes[0].routes?.push(loadRoute);
        }

        return loadRoute;
    });

    // 更改login路由
    let findLoginRouteIndex = routes[0].routes?.findIndex(r => r.path === LOGIN_URL) || -1;
    if (findLoginRouteIndex !== -1) {
        // 替换路由，设置layout为false
        routes[0].routes?.splice(findLoginRouteIndex, 1, {...routes[0].routes?.[findLoginRouteIndex], layout: false});
    }else{
        // 在首位重新增加登录路由，会优先匹配使用（约定路由中的登录会包括在BasicLayout中）
        routes.unshift({
            path: '/login',
            exact: true,
            component: dynamic({
                loader: () => loadLogin,
                loading: LoadingComponent
            })
        });
    }

    // console.log(routes)
}