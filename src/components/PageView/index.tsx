import React, {useContext, useEffect, useRef, useState} from "react";
import ProTable, {ProTableProps, TableDropdown} from '@ant-design/pro-table';
import {Button, message, Modal, Space, Spin, Tooltip} from "antd";
import {DownloadOutlined, ExclamationCircleOutlined, PlusOutlined} from '@ant-design/icons';

import {OpenDisplayType, PageActionType, PagePathType} from "../../types";
import {PageColumns, usePageModel} from "../../hooks/usePageModel";
import PageDetailsView, {DetailsViewActionType, PageDetailsViewProps} from "../PageDetailsView";
import FormView, {FormViewActionType, FormViewProps} from "../FormView";
import {delRequest, loadQuerySchema, pageRequest} from "../../services/base/ServiceRequest";
import {PageCardTabs} from "../PageCardTabs";
import {QuickSearchParamType, supportQuickSearch} from "../PageQuickSearch";
import {useHistory} from 'umi';
import ProProvider from "@ant-design/pro-provider";
import {useValueTypeProvider} from "../../provider/FormProvider";
import PageExportModal, {PageExportModalActionType} from "../PageExportModal";

// 列表页类型
export declare type PageViewProps<CREATE, EDIT, QUERY, INFO> = {
    pageKey: string,// 页面key
    pageName: string,// 页面名称
    pagePaths?: Record<PagePathType, string>, // 相关URL定义，不定义，将以约定ＵＲＬ访问
    pageOptions?: Record<PagePathType, OpenDisplayType>,// 相关操作配置，默认全部开启
    idKey?: string, // ID的字段名称，默认为'id'
    idsKey?: string,// 批量操作ID的字段名，默认是'ids'
    loadSchema?: boolean, // 是否加载远程schema（【约定】通过请求[表单提交URL]，并设置header参数[schema_=true]。这样和和服务端约定是获取当前表单的json schema ）
    customColumns?: PageColumns<INFO>[],// 本地自定义表格schema，如果有加载远程，则会优先使用（将会合并替换远程加载的字段配置）
    rowOptions?: PageActionType<INFO>[] | false, // 表格行操作栏，会和默认的 “编辑”，"查看"，“删除”合并；为false则关闭操作栏
    rowOptionWidth?: number | string, // 表格行操作栏宽度
    detailsProps?: PageDetailsViewProps<INFO>, // 详情页配置
    createFormProps?: FormViewProps<CREATE, INFO>, // 新增表单配置
    editFormProps?: FormViewProps<EDIT, INFO>, // 编辑表单配置
    exportQuerySize?: number, // 导出查询大小
} & ProTableProps<INFO, QUERY>;

// 列表页
function PageView<CREATE extends object/*创建对象*/,
    EDIT extends object/*编辑对象*/,
    QUERY extends object/*查询对象*/,
    INFO extends object/*值对象*/>(props: PageViewProps<CREATE, EDIT, QUERY, INFO>) {

    const {
        pageKey,
        pageName,
        pagePaths,
        pageOptions = {
            create: 'drawer',
            edit: 'drawer',
            show: 'drawer',
            del: true,
            export: true
        },
        idKey = 'id',
        idsKey = 'ids',
        loadSchema = true,
        customColumns = [],
        rowOptions,
        rowOptionWidth,
        detailsProps,
        createFormProps,
        editFormProps,
        exportQuerySize = 500,
        ...rest
    } = props;

    const history = useHistory();

    // 加载列定义
    const [columns, setColumns] = useState<PageColumns<INFO>[]>([]);
    useEffect(() => {
        // 远程加载 loading todo
        loadQuerySchema<INFO>(getPath("page"), customColumns).then((pageColumns) => {
            setColumns(() => pageColumns)
        });
    }, [])

    // 页面model，定义了列表展示相关通用状态和控制
    const pageModel = usePageModel<INFO>(columns);

    const showActionRef = useRef<DetailsViewActionType<INFO>>();
    const createActionRef = useRef<FormViewActionType<any, INFO>>();
    const editActionRef = useRef<FormViewActionType<any, INFO>>();
    const exportActionRef = useRef<PageExportModalActionType>()

    const input = (displayType?: OpenDisplayType,) => {
        const type = displayType || getOptionDisplayTpye('create');
        if (type === 'open') {
            history.push(getPath('input'));
            return;
        }
        createActionRef.current?.load(type, false, null, false);
    }

    const show = (record: INFO, displayType?: OpenDisplayType, reload?: boolean) => {
        const type = displayType || getOptionDisplayTpye('show');
        if (type === 'open') {
            const path = getPath('show') + '?' + idKey + '=' + getId(record);
            history.push(path);
            return;
        }
        showActionRef.current?.load(type, record, reload);
    }

    const load = (record: INFO, displayType?: OpenDisplayType, reload?: boolean) => {
        const type = displayType || getOptionDisplayTpye('edit');
        if (type === 'open') {
            const path = getPath('load') + '?' + idKey + '=' + getId(record);
            history.push(path);
            return;
        }
        editActionRef.current?.load(type, false, record, reload);
    }

    const del = (ids: (number | string)[], onDeleted?: () => void) => {
        const {confirm} = Modal;
        confirm({
            title: '确认删除?',
            icon: <ExclamationCircleOutlined/>,
            content: '',
            onOk() {
                delRequest(getPath('del'), ids, idsKey).then((resp) => {
                    if (resp.success) {
                        message.success({content: '操作成功', key: 'process'});
                        if (onDeleted) {
                            onDeleted();
                        }
                        pageModel.actionRef.current?.reload();
                    } else {
                        message.error({content: resp.message, key: 'process'});
                    }
                })
            },
            onCancel() {
            },
        });
    }

    // 获取访问路径
    const getPath = (pathType: PagePathType): string => {
        if (pagePaths) {
            // @ts-ignore
            let kyes = Object.keys(pagePaths);
            if (kyes.indexOf(pathType) !== -1) {
                // @ts-ignore
                return Reflect.get(pagePaths, pathType);
            }
        }
        return '/' + pageKey + '/' + pathType
    }

    const hasOptions = (pathType: PagePathType): boolean => {
        if (pageOptions) {
            let kyes = Object.keys(pageOptions);
            if (kyes.indexOf(pathType) !== -1) {
                return Reflect.get(pageOptions, pathType) !== 'none';
            }
        }
        return true;
    }

    const getOptionDisplayTpye = (pathType: PagePathType): OpenDisplayType => {
        if (pageOptions) {
            let kyes = Object.keys(pageOptions);
            if (kyes.indexOf(pathType) !== -1) {
                return Reflect.get(pageOptions, pathType);
            }
        }

        return 'drawer';
    }

    // 获取记录ID
    const getId = (record: INFO) => {
        return Reflect.get(record, idKey);
    }

    // 生成表格行操作栏 todo 考虑操作权限
    const renderRowOptions = (record: INFO): React.ReactNode => {

        if (rowOptions === false) {
            // 关闭操作栏
            return null;
        }

        let options = [];

        if (hasOptions('edit')) {
            // 编辑按钮
            options.push(<a
                key="editable"
                onClick={() => {
                    load(record);
                }}
            >
                编辑
            </a>);
        }

        if (hasOptions('show')) {
            // 查看按钮
            options.push(<a
                key="show"
                onClick={() => {
                    show(record);
                }}
            >
                查看
            </a>);
        }

        // 构建显示按钮
        rowOptions?.filter(option => !option.dropdown).map((option) => {
            options.push(<a
                key={option.key}
                onClick={() => {
                    if (option.onHandle) {
                        option.onHandle(record);
                    }
                }}
            >
                {option.name}
            </a>);
        })

        // 构建下拉按钮，“删除”，默认放入
        const downMenus: { key: string, name: string }[] = [];
        const actionMap: Map<string, (record: INFO) => void | undefined> = new Map();
        if (hasOptions('del')) {
            downMenus.push({key: 'del', name: '删除'});
            // @ts-ignore
            actionMap.set('del', (record) => {
                del(getId(record))
            });
        }
        rowOptions?.filter(option => option.dropdown).map((option) => {
            downMenus.push(option);
            // @ts-ignore
            actionMap.set(option.key, option.onHandle);
        })

        options.push(<TableDropdown
            key="actionGroup"
            onSelect={(key) => {
                // @ts-ignore
                actionMap.get(key)(record);
            }}
            menus={downMenus}
        />)

        return options;
    }

    const optionColumn: PageColumns<INFO>[] = rowOptions !== false ? [
        {
            title: '操作',
            valueType: 'option',
            fixed: 'right',
            width: rowOptionWidth || 130,
            render: (text, record, _, action) => renderRowOptions(record),
        }
    ] : [];

    // 获取通用配置
    const values = useContext(ProProvider);

    return (columns && columns.length > 0 ? <>

            <ProProvider.Provider
                value={{
                    ...values,
                    valueTypeMap: useValueTypeProvider(),// 自定义valueType
                }}
            >

                {/* 顶部Tab切换 */}
                <PageCardTabs pageModel={pageModel}/>

                {/* 表格 */}
                <ProTable<INFO, QUERY & QuickSearchParamType>
                    columns={[...columns, ...optionColumn]}
                    actionRef={pageModel.actionRef}
                    rowKey={idKey}
                    request={pageRequest<INFO>(getPath('page'))}
                    beforeSearchSubmit={(params) => {
                        // 合并快捷搜索等参数
                        return {...params, ...pageModel.getCustomParams()}
                    }}
                    editable={{
                        type: 'multiple',
                    }}
                    formRef={pageModel.formRef}
                    rowSelection={{
                        getCheckboxProps: (record: INFO) => ({
                            disabled: false, // Column configuration not to be checked
                        })
                    }}
                    search={{
                        labelWidth: 'auto',
                        filterType: 'light',//light 轻量表单 query 正常表单
                        defaultCollapsed: false,
                    }}
                    headerTitle={pageName + '列表'}
                    toolbar={
                        {
                            // title: <span style={{fontSize: 20}}>{pageName}</span>,
                            subTitle: ``,
                            multipleLine: pageModel.hasPostionTabs('toolbarTab'),
                            tabs: pageModel.buildListToolBarTabs(), //标签页配置，仅当 multipleLine 为 true 时有效
                            menu: pageModel.buildListToolBarMenu(), // 菜单配置
                            search: supportQuickSearch(pageModel),
                            actions: [
                                hasOptions('create') &&
                                <Button key="button" icon={<PlusOutlined/>} type="primary" onClick={() => {
                                    input();
                                }}>新建</Button>,
                                hasOptions('export') &&
                                <Tooltip title={'导出'}>
                                    <DownloadOutlined style={{fontSize: 16, marginLeft: 20}} onClick={() => {
                                        exportActionRef.current?.open(pageModel.actionRef.current?.pageInfo?.total || 0,
                                            // @ts-ignore
                                            pageModel.formRef.current?.getFieldsValue());
                                    }}/>
                                </Tooltip>,
                            ],
                        }
                    }
                    pagination={{
                        pageSize: 15,// 初始查询大小 TODO 根据屏可用高度动态计算 查询大小
                        showQuickJumper: false,
                    }}
                    options={{
                        fullScreen: columns.length > 10, // 支持全屏
                        density: false,
                    }}
                    tableAlertOptionRender={({selectedRowKeys, selectedRows, onCleanSelected}) => {
                        return (
                            <Space size={16}>
                                {
                                    hasOptions('create') && <a onClick={() => {
                                        del(selectedRowKeys, onCleanSelected);
                                    }}>批量删除</a>
                                }
                                <a onClick={onCleanSelected}>取消选择</a>
                            </Space>
                        );
                    }}
                    {...rest}
                />
            </ProProvider.Provider>

            {/* 查看详情 */}
            {
                hasOptions('show') && <PageDetailsView<INFO>
                    actionRef={showActionRef}
                    column={2}
                    url={getPath('page')}
                    pageColumns={columns}
                    {...detailsProps}
                />
            }

            {/* 新增表单 */}
            {
                hasOptions('create') && <FormView<CREATE, INFO>
                    actionRef={createActionRef}
                    pageActionRef={pageModel.actionRef}
                    isHorizontal={true}
                    title={`新增${pageName}`}
                    width={650}
                    url={getPath('create')}
                    loadSchema={loadSchema}
                    columns={[]}
                    {...createFormProps}
                />
            }

            {/* 编辑表单 */}
            {
                hasOptions('edit') && <FormView<EDIT, INFO>
                    actionRef={editActionRef}
                    pageActionRef={pageModel.actionRef}
                    isHorizontal={true}
                    title={`编辑${pageName}`}
                    width={650}
                    url={getPath('edit')}
                    loadUrl={getPath('page')}
                    loadSchema={loadSchema}
                    columns={[]}
                    {...editFormProps}
                />
            }

            {/* 导出数据 */}
            {
                hasOptions('export') && <PageExportModal<INFO>
                    title={`${pageName}导出`}
                    url={getPath('page')}
                    pageColumns={columns}
                    actionRef={exportActionRef}
                    querySize={exportQuerySize}
                />
            }

        </> : <Spin/>
    );

}

export default PageView;
