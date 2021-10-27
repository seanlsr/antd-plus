import React, {useContext, useEffect, useImperativeHandle, useState} from "react";
import ProDescriptions, {ProDescriptionsItemProps} from "@ant-design/pro-descriptions";
import {Drawer, Modal} from "antd";
import {RequestData} from "@ant-design/pro-descriptions/lib/useFetchData";
import {OpenDisplayType} from "../../types";
import {columns2DescriptionsItems, PageColumns} from "../../hooks/usePageModel";
import {loadQuerySchema, loadRequest} from "../../services/base/ServiceRequest";
import {useQueryParam} from "../../hooks/useQueryParam";
import usePagePaths from "../../hooks/usePagePaths";
import ProProvider from "@ant-design/pro-provider";
import {useValueTypeProvider} from "../../provider/FormProvider";


// 详情面板操作类型
export declare type DetailsViewActionType<INFO> = {
  load: (type: OpenDisplayType, record: INFO | null, reload?: boolean) => void
  close: () => void
  record: INFO | null
}

export declare type PageDetailsViewProps<INFO> = {
  isOpen?: boolean,// 表示新开页面
  title?: string,
  width?: number,
  column?: number // 展示列数，默认2列
  url?: string, // 加载数据的url
  idKey?: string, // ID参数名，默认为'id'
  loadSchema?: boolean, // 加载远程schema
  pageColumns?: PageColumns<INFO>[], // 从列表页传的schema
  customColumns?: ProDescriptionsItemProps<INFO, string>[], // 本地自定义schema，则会合并替换
  actionRef?: React.MutableRefObject<DetailsViewActionType<INFO> | undefined> | ((actionRef: DetailsViewActionType<INFO>) => void);
}

/**
 * 详情面板
 * 支持弹出和右抽屉展示
 * @param props
 * @constructor
 */
function PageDetailsView<INFO = any>(props: PageDetailsViewProps<INFO>) {

  const pagePaths = usePagePaths();

  const {
    isOpen = false,
    idKey = 'id',
    url = pagePaths.get('page') || '#',
    column = 2,
    loadSchema = false,
    pageColumns,
    customColumns
  } = props;

  const [type, setType] = useState<OpenDisplayType>(isOpen ? 'open' : 'none');
  const [record, setRecord] = useState<INFO | null>();
  const [reload, setReload] = useState<boolean>(false);
  const [columns, setColumns] = useState<ProDescriptionsItemProps<INFO, string>[]>([]);

  useEffect(() => {

    // 加载列定义
    if (isOpen && loadSchema) {
      loadQuerySchema<INFO>(url)
          .then((pageColumns) => {
            // 要转为descriptionsItems同pagecolums大部份相同
            setColumns((c) => columns2DescriptionsItems<INFO>(pageColumns, customColumns))
          });
    } else if (isOpen && pageColumns) {
      setColumns(c => columns2DescriptionsItems<INFO>(pageColumns, customColumns));
    }

  }, [])

  // @ts-ignore
  useImperativeHandle<DetailsViewActionType<T>>(props.actionRef, () => ({
    load: onLoad,
    close: onClose,
    record: record
  }));

  const onLoad = (type: OpenDisplayType, record: INFO | null, reload?: boolean, reloadSchema?: boolean,) => {
    setType(type);
    setRecord(record);
    if (reload) {
      setReload(reload);
    }

    if (loadSchema && (reloadSchema || columns.length === 0)) {
      // 用异步处理 todo
      loadQuerySchema<INFO>(url)
          .then((pageColumns) => {
            // 要转为descriptionsItems同pagecolums大部相同
            setColumns((c) => columns2DescriptionsItems<INFO>(pageColumns, customColumns))
          });
    } else if (!loadSchema && columns.length === 0 && pageColumns) {
      setColumns((c) => columns2DescriptionsItems<INFO>(pageColumns, customColumns))
    }
  }

  const onClose = () => {
    setType('none');
    setRecord(null);
    setReload(false);
  }

  const getId = () => {
    if (isOpen) {
      // 从路径参数中获取
      return useQueryParam(idKey);
    }

    // 从传入对象中获取
    // @ts-ignore
    return Reflect.get(record, idKey);
  }

  // 本地数据
  const localRecord = () => {
    // 返回传入的对象
    return Promise.resolve({
      success: true,
      data: record
    } as RequestData);
  }

  const isDrawer = record && type === 'drawer';
  const isModal = record && type === 'modal';

  console.log('-----------------------------------------page details render [' + type + ']')

  // 获取通用配置
  const values = useContext(ProProvider);

  return <ProProvider.Provider
      value={{
        ...values,
        valueTypeMap: useValueTypeProvider(),// 自定义valueType
      }}
  >

    {/*查看详情-右抽屉展示*/}
    {
      isDrawer && <Drawer title={'查看详情'}
                          width={props.width || 600}
                          visible={isDrawer}
                          onClose={onClose}>
        <ProDescriptions
            title={props.title || ''}
            column={column}
            columns={columns}
            request={isOpen || reload ? loadRequest(url, getId(), idKey) : localRecord}
        />
      </Drawer>
    }

    {/*查看详情-弹出框展示*/}
    {
      isModal && <Modal title={'查看详情'}
                        width={props.width || 600}
                        visible={isModal}
                        onOk={onClose}
                        onCancel={onClose}
                        destroyOnClose={true}>
        <ProDescriptions
            title={props.title || ''}
            column={column}
            columns={columns}
            request={isOpen || reload ? loadRequest(url, getId(), idKey) : localRecord}
        />
      </Modal>
    }

    {/*查看详情-新页面*/}
    {isOpen && <ProDescriptions
        title={props.title || ''}
        column={column}
        columns={columns}
        request={isOpen || reload ? loadRequest(url, getId(), idKey) : localRecord}
    />
    }

  </ProProvider.Provider>
}

export default PageDetailsView;
