import React, {CSSProperties, useContext, useEffect, useImperativeHandle, useRef, useState} from "react";
import {BetaSchemaForm, ProFormLayoutType} from "@ant-design/pro-form";
import {FormInstance, message} from "antd";
import {FormSchema} from "@ant-design/pro-form/lib/components/SchemaForm";
import {Store} from "rc-field-form/lib/interface";
import {ActionType} from "@ant-design/pro-table/lib/typing";
import {FormLayout} from "antd/lib/form/Form";
import {ColProps} from "antd/lib/grid/col";
import {FooterToolbar} from "@ant-design/pro-layout";
import {SubmitterProps} from "@ant-design/pro-form/lib/components/Submitter";
import ProProvider from '@ant-design/pro-provider';
import {OpenDisplayType} from "../../types";
import {FormColumns} from "../../hooks/usePageModel";
import {formSubmitRequest, loadFormSchema, loadRecordRequest} from "../../services/base/ServiceRequest";
import {useQueryParam} from "../../hooks/useQueryParam";
import {useValueTypeProvider} from "../../provider/FormProvider";
import {useHistory, useRouteMatch} from "umi";
import usePagePaths from "../../hooks/usePagePaths";

import "antd/es/cascader/style"; // TODO 配置了babel-plugin-import，但在schema动态表单下可能不会生效，所以这里引入下style

// 表单面板的操作类型
export declare type FormViewActionType<EVT, INFO> = {
  load: (type: OpenDisplayType, reloadSchema?: boolean, record?: INFO | null, reload?: boolean) => void
  close: () => void
  record: INFO | null
}

// 表单视图类型
export declare type FormViewProps<EVT/*请求对象*/, INFO/*值对象*/> = {
  isOpen?: boolean,// 表示新开页面
  isHorizontal?: boolean,// 标签和表单项是否采用横向布局
  url?: string, // 表单提交URL（设置header参数schema_=true，为获取相关表单的schema json）,不设置，从路由中获取约定的提交URL
  idKey?: string, // ID参数名，默认为'id'
  loadUrl?: string, // 获取对象URL
  loadSchema?: boolean, // 是否加载远程schema（【约定】通过请求[表单提交URL]，并设置header参数[schema_=true]。这样和和服务端约定是获取当前表单的json schema ）
  columns?: FormColumns<EVT>[] | undefined,// 本地自定义schema，如果有加载远程，则会优先使用（将会合并替换远程加载的字段配置）
  actionRef?: React.MutableRefObject<FormViewActionType<EVT, INFO> | undefined>,
  pageActionRef?: React.MutableRefObject<ActionType | undefined>, // 列表操作Ref，用来刷新列表或表格数据
  toPath?: string; // 新开页面，操作成功后的跳转路由，不设置，则默认跳到上一页
} & FormSchema<EVT, INFO>;

// layout映射
const layoutMap: Map<OpenDisplayType, ProFormLayoutType>
  = new Map<OpenDisplayType, ProFormLayoutType>([
  ['open', 'Form'],
  ['drawer', 'DrawerForm'],
  ['modal', 'ModalForm'],
  ['none', 'ModalForm']
]);

/**
 * 表单面板
 * 支持弹出、右抽屉展示和新开页面
 * @param props
 * @constructor
 */
function FormView<EVT extends object, INFO = object>(props: FormViewProps<EVT, INFO>) {

  // 从请求处传来的（用约定参数 pageName_）
  const pageName = useQueryParam('pageName_');
  const pagePaths = usePagePaths();
  const {path} = useRouteMatch();
  const history = useHistory();

  let defUrl;
  if (path.endsWith('/input')) {
    defUrl = pagePaths.get('create');
  } else if (path.endsWith('/load')) {
    defUrl = pagePaths.get('edit');
  }

  const {
    isOpen = false,
    isHorizontal = true,
    url = defUrl || '', //TODO 默认
    idKey = 'id',
    loadUrl = pagePaths.get("page"),
    loadSchema,
    columns,
    actionRef,
    pageActionRef,
    toPath,
    ...rest
  } = props;
  const formRef = useRef<FormInstance<EVT | {}>>();

  // const { initialState } = useModel('@@initialState');

  const [type, setType] = useState<OpenDisplayType>(isOpen ? 'open' : 'none');
  const [record, setRecord] = useState<INFO | null>();
  const [reload, setReload] = useState<boolean>(false);

  // 表单layout
  const [layoutType, setLayoutType] = useState<ProFormLayoutType | undefined>('Form');

  // 表单字段schema
  const [formSchemas, setFormSchemas] = useState<FormColumns<EVT>[]>([]);

  // 是否显示 ()
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {

    // 加载列定义
    if (isOpen && loadSchema) {
      // 新打开页面需要加载schema
      loadFormSchema<EVT>(url, columns)
        .then((formColumns) => {
          setFormSchemas(c => formColumns);
        });
    } else if (isOpen && columns) {
      setFormSchemas(c => columns);
    }

    if (isOpen && loadUrl) {
      loadRecordRequest<INFO>(loadUrl, getId(), idKey).then((loadRecord) => {
        setRecord(() => loadRecord);
        setVisible(true); //record加载完再设置，以确保表单渲染时有值
      });
    } else if (isOpen) {
      setVisible(true);
    }

    setLayoutType(layoutMap.get(type));

  }, [])

  // @ts-ignore
  useImperativeHandle<DetailsViewActionType<EVT>>(props.actionRef, () => ({
    load: onLoad,
    close: onClose,
    record: record
  }));

  const onLoad = (type: OpenDisplayType, reloadSchema?: boolean, record?: INFO | null, reload?: boolean) => {
    setType(type);

    if (reload) {
      setReload(reload);
    } else {
      setRecord(() => record);
    }

    setLayoutType(layoutMap.get(type));

    if (loadSchema && (reloadSchema || formSchemas.length === 0)) {
      // loading todo
      loadFormSchema<EVT>(url, columns).then((loadColumns) => {
        setFormSchemas(loadColumns);
      })
    } else if (!loadSchema && formSchemas.length === 0) {
      setFormSchemas(columns);
    }

    if (reload && record && loadUrl) {
      // 重新加载记录  loading todo
      loadRecordRequest<INFO>(loadUrl, getId(record), idKey).then((loadRecord) => {
        setRecord(() => loadRecord);
        setVisible(true);
      });
    } else {
      setVisible(true);
    }
  }

  const onClose = (v: boolean) => {
    if (!v) {
      setType('none');
      setRecord(null);
      setReload(false);
    }
    setVisible(v);
  }

  const getId = (record?: INFO) => {
    if (isOpen) {
      // 从路径参数中获取
      return useQueryParam(idKey);
    }

    // 从传入对象中获取
    // @ts-ignore
    return Reflect.get(record, idKey);
  }

  // 提交表单
  const onFinishHandle = async (values: EVT) => {

    // TODO 重复提交控制

    formSubmitRequest<EVT>(url, values).then(resp => {
      if (resp.success) {
        message.success({content: '操作成功', key: 'process'});
        setVisible(false);

        if (pageActionRef) {
          // 刷新列表 TODO
          pageActionRef.current?.reload();
        } else if (toPath) {
          // 跳转到指定路由
          history.push(toPath);
        } else {
          // 跳转到上一页面
          history.goBack();
        }

      } else {
        // 错误提示
        message.error({content: resp.message, key: 'process'});
      }
    })
  }

  // 'drawer' | 'modal' 的默认可选项配置
  const visibleOption = isOpen ? {} : {
    visible: visible,
    onVisibleChange: onClose,
    submitter: {
      searchConfig: {
        resetText: '重置',
      },
      resetButtonProps: {
        onClick: () => {
          formRef.current?.resetFields();
        },
      },
    }
  }

  // @ts-ignore
  const modalOption: CSSProperties = (layoutType === 'modal') ? {
    maxHeight: 300 //TODO 控制不了弹窗的最大高度
  } : {}

  const horizontalOption: {
    layout?: FormLayout,
    labelCol?: ColProps;
    wrapperCol?: ColProps
  } = isHorizontal || isOpen ? {
    labelCol: {span: 6},
    wrapperCol: {span: 12},
    layout: 'horizontal',
  } : {};

  // open 的默认可选项配置
  const openOption: {
    layout?: FormLayout,
    labelCol?: ColProps;
    wrapperCol?: ColProps;
    submitter?: SubmitterProps<{
      form?: FormInstance<any>;
    }> | false;
  } = isOpen ? {
    ...horizontalOption,
    // 采用置底提交按钮
    submitter: {
      render: (_, dom) => <FooterToolbar>{dom}</FooterToolbar>,
    }
  } : {};

  console.log('---------------------------------form render [visible=' + visible + '][layoutType=' + layoutType + ']')

  // 获取通用配置
  const values = useContext(ProProvider);
  // values = {...values,valueTypeMap: useValueTypeProvider()}

  // @ts-ignore
  return (

    <ProProvider.Provider
      value={{
        ...values,
        valueTypeMap: useValueTypeProvider(),// 自定义valueType
      }}
    >

      {
        visible ?
          <BetaSchemaForm<EVT>
            {...rest}
            title={rest.title || pageName!}
            formRef={formRef}
            layoutType={layoutType}
            columns={formSchemas}
            onFinish={onFinishHandle}
            initialValues={record as Store/*首次渲染有效，请确保record已加载到statue*/}
            {...visibleOption}
            {...openOption}
            {...horizontalOption}
          />
         : <></>
      }

    </ProProvider.Provider>
  )
}

export default FormView;

/**
 * TODO
 * 1、自有FormCascader组件回显未实现（pro有bug，无法从dataIndex指的字段表达式中获取值 透传给组件）
 * 2、只读字段，服务端未生成处理  已解决，待测
 * 3、联动显示/隐藏未实现
 * 4、富文本编辑未集成  存在富文本时，建议打开新页面
 * 5、图片/文件上传和多图/文件上传未实现
 * 6、提建议，自定义valueType时，renderFormItem 无法把原始的字段props传入（需要依赖一些自定义的扩展属性来实现render就无法满足了）
 * 7、lookup未实现
 * 8、考虑路由参数的类型怎么定义
 * 9、服务端统一schema，完全实现动态生成，根据 控制类类的方法生成
 * 10、表格内可编辑，如：状态切换、下拉切换、input
 */
