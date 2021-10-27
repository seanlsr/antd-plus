import {Key, useEffect, useRef} from "react";
import {ActionType} from "@ant-design/pro-table";
import {FormInstance} from "antd";
import {ProColumns} from "@ant-design/pro-table/es";
import {ListToolBarMenu, ListToolBarTabs} from "@ant-design/pro-table/lib/components/ListToolBar";
import {ProDescriptionsItemProps} from "@ant-design/pro-descriptions";
import {ProSchemaValueEnumType} from "@ant-design/pro-utils/lib/typing";
import {ProFormColumnsType} from "@ant-design/pro-form";
import {SupportQuickSearchType, SupportSchemaLoader} from "../../types";
import {EnumValue} from "../../utils";

export declare type PageColumns<T = any> =
  ProColumns<T>
  & SupportSchemaLoader
  & {
  keywordSearch?: boolean | number/*是否启用关键字搜索|启用关键字搜索的排序*/,
  tabsSearch?: boolean | { position?: PageTabsPosition, activeKey?: string, appendFirst?: boolean | string[] } /*是否启用tab切换搜索*/
};

export declare type FormColumns<T = any> = ProFormColumnsType & SupportSchemaLoader & {extParams?: string[]};

/**
 * 预定的Tab切换
 */
export declare type PageTabsPosition = 'cardTab' | 'toolbarTab' | 'toolbarMenu' | 'otherTab';

export declare type PageTabsType = {
  name: string,
  position: PageTabsPosition, // 默认为 toolbarTab
  activeKey: string, //默认值为''
  appendFirst: string[], // 插入首选项
  bindForm?: boolean, // 读取 !column.hideForm
  items: EnumValue[]; // 从column获取
};

export declare type PageCustomParamsType = SupportQuickSearchType;


export const buildQuickSearchOptions = <T>(columns: PageColumns<T>[]): EnumValue[] => {
  let values: EnumValue[] = [];
  if (columns && columns.length > 0) { //TODO 排序未解决
    columns.map((pageColumn) => {
      if (pageColumn.keywordSearch && (pageColumn.key || pageColumn.dataIndex)) {
        values.push({
          text: pageColumn.title as string,
          value: pageColumn.key as string || pageColumn.dataIndex as string
        })
      }
    })
  }
  console.log('quickSeqrch->' + JSON.stringify(values));
  return values;
}

export const buildTabsSearch = <T>(columns: PageColumns<T>[]): Map<PageTabsPosition, PageTabsType> => {

  let tabsMap: Map<PageTabsPosition, PageTabsType> = new Map<PageTabsPosition, PageTabsType>();

  if (columns && columns.length > 0) {
    columns.map(pageColumn => {
      if (pageColumn.tabsSearch && pageColumn.valueEnum) {
        const isDef = typeof pageColumn.tabsSearch === 'boolean';

        const valueEnumMap = pageColumn.valueEnum;
        let items: EnumValue[] = [];

        if (valueEnumMap instanceof Map) {
          for (let item of valueEnumMap.values()) {
            if (item) {
              const valueEnum = item as ProSchemaValueEnumType;
              items.push({text: valueEnum.text as string, value: valueEnum.status})
            }
          }
        } else {
          Object.keys(valueEnumMap).map((key) => {
            const valueEnum = Reflect.get(valueEnumMap, key) as ProSchemaValueEnumType;
            items.push({text: valueEnum.text as string, value: valueEnum.status})
          })
        }

        if (isDef && pageColumn.tabsSearch) {
          tabsMap.set('toolbarTab', {
            position: 'toolbarTab',
            activeKey: '',
            appendFirst: ['全部', ''],
            bindForm: !pageColumn.hideInForm,
            name: pageColumn.key as string || pageColumn.dataIndex as string,
            items: items
          })
        } else if (pageColumn.tabsSearch) {
          const tabsType = pageColumn.tabsSearch as { position?: PageTabsPosition, activeKey?: string, appendFirst?: boolean | string[] };
          const position: PageTabsPosition = tabsType.position || 'toolbarTab';
          tabsMap.set(position, {
            position: position,
            activeKey: tabsType.activeKey || '',
            appendFirst: Array.isArray(tabsType.appendFirst) ? tabsType.appendFirst as string[] : ['全部', ''],
            bindForm: !pageColumn.hideInForm,
            name: pageColumn.key as string || pageColumn.dataIndex as string,
            items: items
          })
        }
      }
    });
  }

  return tabsMap;
}

export const usePageModel = <T>(columns: PageColumns<T>[]) => {

  // 相关引用
  const actionRef = useRef<ActionType>();
  const formRef = useRef<FormInstance<T | {}>>();

  // 额外参数
  let customParams = {};

  // Tab状态 TODO 使用let变量，当设置有值初始状时，不会切换当前态 待解决（'cardTabs'有组件态，可正常使用）
  let tabsMap: Map<PageTabsPosition, PageTabsType> = buildTabsSearch(columns);

  //console.log('---------------------------------usePageModel')

  useEffect(() => {

    // 绑定tab默认值到表单值中
    let needSubmit = false;
    tabsMap.forEach((tabType) => {

      if (tabType.activeKey && tabType.activeKey !== '') {

        if (tabType.bindForm && tabType.name) {
          // 绽定表单
          setFormRefField(tabType.name, tabType.activeKey, true);
          needSubmit = true;
        }
      }
    })

    if (needSubmit) {
      formRef.current?.submit();
    }
  }, []);

  const saveCustomParam = (key: string, value: any) => {
    customParams = {...customParams, [key]: value}
  }

  const getCustomParam = (key: string) => {
    const customParam = Reflect.get(customParams, key);
    console.debug('【' + key + '】 -> ', customParam)
    return customParam;
  }

  const getCustomParams = () => {
    return customParams;
  }

  // 设置TAB切换状态
  const setTabsActiveKey = (position: PageTabsPosition, activeKey: string) => {

    let toolbarTab = tabsMap.get(position);
    if (!toolbarTab) {
      return;
    }

    const oldActiveKey = toolbarTab.activeKey;

    if (activeKey !== oldActiveKey) {
      // 设置内部变量
      toolbarTab.activeKey = activeKey;
      tabsMap.set(position, toolbarTab);

      if (toolbarTab.bindForm && toolbarTab.name) {
        setFormRefField(toolbarTab.name, activeKey === 'item_0' ? '' : activeKey);
      }
    }
  }

  const getTabsActiveKey = (position: PageTabsPosition) => {
    let key = tabsMap.get(position)?.activeKey;

    if (!key) {
      let tab = tabsMap.get(position);
      key = tab ? formRef.current?.getFieldValue(tab.name) : '';
    }
    return key;
  }

  const setFormRefField = (field: string, value: any, notSubmit?: boolean) => {
    console.log('[' + field + ']=', value)
    const fieldsValue = formRef.current?.getFieldsValue();

    // @ts-ignore
    if (!fieldsValue || !Reflect.has(fieldsValue, field)) {
      // 设置到自定义参数
      saveCustomParam(field, value);
    }

    formRef.current?.setFieldsValue({[field]: value});
    //console.log('fields->' + JSON.stringify(formRef.current?.getFieldsValue()));
    if (!notSubmit) {
      formRef.current?.submit();
    }
  }

  const buildListToolBarTabs = (): ListToolBarTabs | undefined => {
    if (tabsMap.size > 0) {
      let tab = tabsMap.get('toolbarTab');
      if (tab?.items) {
        let toolbarTabs: ListToolBarTabs = {
          items: [],
          activeKey: getTabsActiveKey('toolbarTab'),
          onChange: (key) => {
            setTabsActiveKey('toolbarTab', key);
          }
        }

        if (tab.appendFirst) {
          toolbarTabs.items?.push({key: tab.appendFirst[1], tab: tab.appendFirst[0]})
        }

        tab.items.map((item) => {
          toolbarTabs.items?.push({key: item.value, tab: item.text});
        })

        return toolbarTabs;
      }
    }
    return undefined;
  }

  const buildListToolBarMenu = (type?: 'inline' | 'dropdown' | 'tab'): ListToolBarMenu | undefined => {
    if (tabsMap.size > 0) {
      let tab = tabsMap.get('toolbarMenu');
      if (tab?.items) {
        let toolbarMenus: ListToolBarMenu = {
          items: [],
          type: type || 'dropdown',
          activeKey: getTabsActiveKey('toolbarMenu') as Key,
          onChange: (key) => {
            setTabsActiveKey('toolbarMenu', key as string);
          }
        }

        if (tab.appendFirst) {
          toolbarMenus.items?.push({key: tab.appendFirst[1], label: tab.appendFirst[0]})
        }

        tab.items.map((item) => {
          toolbarMenus.items?.push({key: item.value, label: item.text});
        })

        return toolbarMenus;
      }
    }
    return undefined;
  }

  const quickSearchOptions = () => {
    return buildQuickSearchOptions(columns);
  }

  const getPostionTabs = (postion: PageTabsPosition): PageTabsType | undefined => {
    return tabsMap.get(postion);
  }

  const hasPostionTabs = (postion: PageTabsPosition): boolean => {
    return tabsMap.has(postion);
  }

  return {
    actionRef,
    formRef,
    getCustomParams,
    quickSearchOptions,
    saveCustomParam,
    getCustomParam,
    setTabsActiveKey,
    getTabsActiveKey,
    setFormRefField,
    buildListToolBarTabs,
    buildListToolBarMenu,
    getPostionTabs,
    hasPostionTabs,
  }
}

/**
 * 表格列转为详情列
 * @param columns 表格列
 */
export const columns2DescriptionsItems
  = <T>(columns: PageColumns<T>[], customColumns?: ProDescriptionsItemProps<T, string>[]): ProDescriptionsItemProps<T, string>[] => {

  let items: ProDescriptionsItemProps<T, string>[] = [...columns as ProDescriptionsItemProps<T, string>[]];

  // 合并替换自定义列
  if (customColumns && customColumns.length > 0) {
    customColumns.map((customColumn) => {

      let findColumn
      items.map((rc) => {
        if (rc.key === customColumn.key) {
          findColumn = rc;
        }
      })

      if (findColumn) {
        findColumn = Object.assign(findColumn, customColumn);
      } else {
        items.push(customColumn);
      }
    })
  }

  items = items.sort((c1, c2) => {
    // 按index重新排序，因为可能会有本地定义的字段，会按index穿插进来
    const i1 = Reflect.get(c1, 'index') || 1;
    const i2 = Reflect.get(c2, 'index') || 0;
    return i1 > i2 ? 1 : -1;
  })

  // TODO antd pro BUG：有index，不会按顺序排列
  items.forEach((item => {
    Reflect.deleteProperty(item,'index')
  }))

  return items;
}
