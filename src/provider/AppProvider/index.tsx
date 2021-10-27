// @ts-nocheck
import type {Settings as LayoutSettings} from '@ant-design/pro-layout';
import {MenuDataItem} from "@ant-design/pro-layout";
import {API} from "../../types";
import {currentAdminRequest, requestConfigs, requestMenus} from "../../services/base/ServiceRequest";
import {LOGIN_URL} from "../../env/EnvVariableConfiguration";

/**
 * 初始化数据
 * 提供给plugin-initial-state使用
 */
export type InitialState = {
    settings?: Partial<LayoutSettings>;
    currentUser?: API.CurrentUser;
    fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
    schemaConfig?: Map<string, string>;
    menus?: MenuDataItem[];
    fetchMenus?: () => Promise<MenuDataItem[]>;
    configs?: Map<string, string>;
    getConfig?: (name: string) => string;
}

export const initialState = async (history: any): Promise<InitialState> => {

    // console.log(history);

    // 获取当前登录用户
    const fetchUserInfo = async () => {
        try {
            return await currentAdminRequest();
        } catch (error) {
            history.push(LOGIN_URL);
        }
        return undefined;
    };

    // 获取菜单（登录后才能获取）
    const fetchMenus = async () => {
        return await requestMenus({}, []);
    }

    // 加载配置项
    const configs = await requestConfigs();

    // 获取配置项值
    const getConfig = (name: string) => {
        return configs ? configs[name] : '';
    }

    if (history?.location.pathname === LOGIN_URL || history?.location.pathname === '/' || history?.location.pathname === '/logout') {
        // 如果是登录页面，不执行
        return {
            fetchUserInfo,
            fetchMenus,
            settings: {},
            configs,
            getConfig: getConfig
        };
    } else {
        try {
            const currentUser = await fetchUserInfo();
            // 加载菜单
            const menus = await fetchMenus();
            return {
                fetchUserInfo,
                fetchMenus,
                currentUser,
                settings: {},
                schemaConfig: undefined,
                menus,
                configs,
                getConfig: getConfig
            };
        } catch (e) {
            return {
                fetchUserInfo,
                fetchMenus,
                settings: {},
                configs,
                getConfig: getConfig
            };
        }
    }
}


/**
 * 构建面包宵
 * @param initialState
 */
export const buildBreadcrumb = (pathname: string, initialState: any): { path: string, breadcrumbName: string, kye?: string }[] => {
    // 最多支持三级菜单模式
    const breadcrumbs: [] = [];
    const currMenus = findMenuPath(pathname, initialState);
    const menuLevel = (currMenus?.length || 0);
    currMenus.forEach((menu, index) => {
        breadcrumbs.push({path: '', breadcrumbName: menu.name + (index === menuLevel - 1 ? ' ' : ''), key: menu.key});// TODO path暂时为空，缺少跳转路由的配置
    })
    return breadcrumbs;
}

const findMenuPath = (pathname: string, initialState: any): MenuDataItem[] => {
    try {
        const path = pathname.substring(0, pathname.indexOf('/', 1) + 1);
        const currMenus: MenuDataItem[] = [];
        let firstMenus = initialState?.menus.length === 1 ? initialState?.menus[0].children : initialState?.menus;
        firstMenus?.forEach((first) => {
            if (first.path.startsWith(path)) {
                currMenus[0] = first;
            }
            first.children?.forEach((second) => {
                if (second.path.startsWith(path)) {
                    currMenus[0] = first;
                    currMenus[1] = second;
                }
                second.children?.forEach((third) => {
                    if (third.path.startsWith(path)) {
                        currMenus[0] = first;
                        currMenus[1] = second;
                        currMenus[2] = third;
                    }
                })
            })
        })
        return currMenus;
    } catch (e) {
        return [];
    }
}
