
import React from "react";
import {ProFieldFCRenderProps, ProRenderFieldPropsType, ProSchemaValueEnumObj} from "@ant-design/pro-provider";
import {DataNamesType, DataRequestType, SchemaLoaderType, SupportSchemaLoader} from "../../types";
import FormCascader from "../../components/FormCascader";
import FormUpload from "../../components/FormUpload";
import {FormColumns, PageColumns} from "../../hooks/usePageModel";
import {selectRequest} from "../../services/base/ServiceRequest";
import {Card, Image, Modal, Space} from 'antd';
import FormEditor from "../../components/FormEditor";
import {IconFont, IconFontSelect} from "../../components/IconFontSelect";

export const useValueTypeProvider = (): Record<string, ProRenderFieldPropsType> => {

    return {
        cascader_: {
            render: (text) => <a>{text}</a>,
            renderFormItem: ((text: any, props: ProFieldFCRenderProps & SupportSchemaLoader, dom: JSX.Element) => {
                const {loader} = props;
                console.debug('------------------code=' + loader?.code)
                return (<FormCascader dataRequest={{url: '/' + loader?.code + '/select', params: {level: 1}}}
                                      level={loader?.level}/>);
            })
        },
        images_: {
            render: (text) => {
                const value = text as string;
                if (value && value !== '') {
                    const images = value.split(',');
                    return <Image.PreviewGroup>
                        <Space>
                            {
                                images.map((image: string | undefined, index: any) => {
                                    return <Image
                                        key={`img_${index}`}
                                        width={96}
                                        src={image}
                                    />
                                })
                            }
                        </Space>
                    </Image.PreviewGroup>
                }

                return <span>-</span>
            },
            renderFormItem: ((text: any, props: ProFieldFCRenderProps, dom: JSX.Element) => {
                const {valueEnum} = props;
                return <FormUpload valueType='images_' options={valueEnum} value={text}/>
            })
        },
        editor_: {
            render: (text) => {
                if (text) {
                    return <a onClick={() => {
                        Modal.info({
                            width: 1000,
                            title: '查看',
                            content: <Card>
                                <div dangerouslySetInnerHTML={{__html: text as string}}/>
                            </Card>
                        });
                    }}> 查看 </a>
                }
                return <span>-</span>
            },
            renderFormItem: ((text: any, props: ProFieldFCRenderProps) => {
                return <FormEditor value={text} {...props} {...props?.fieldProps}/>
            })
        },
        iconFont_: {
            render: (text) => {
                if (text) {
                    return <IconFont type={text}/>
                }
                return <span>-</span>
            },
            renderFormItem: ((text: any, props: ProFieldFCRenderProps) => {
                return <IconFontSelect value={text} {...props} {...props?.fieldProps}/>
            })
        }
    }
}

export declare type ProcessSchema<T> = FormColumns<T> & PageColumns<T>;

const uploadValueTypes = ['image', 'video_', 'file_', 'files_'];

// 处理绑定加载等
export const processLoader = (columns?: ProcessSchema<any>[] | undefined) => {

    columns?.map((column) => {

        const valueType = column.valueType as string;

        // 文件上传
        if (uploadValueTypes.includes(valueType)) {
            const {valueEnum, tooltip} = column;
            // @ts-ignore
            column.renderFormItem = ((item, {type, defaultRender, ...rest}, form) => {
                return <FormUpload valueType={valueType} options={valueEnum as ProSchemaValueEnumObj}/>
            });
            column.tooltip = undefined;
        }

        if (column?.loader && !column.loader.preload) {

            let loader = column?.loader;

            let dataRequest: DataRequestType = {url: ''};
            let dataNames: DataNamesType = {};

            if (loader?.type === 'ITEM') {
                dataRequest.url = '/item/select';
                dataRequest.params = {code: loader.code};
            } else if (loader?.type === 'DICT') {
                dataRequest.url = '/dict/select';
                dataRequest.params = {parentCode: loader.code};
                dataNames.id = 'name';
                dataNames.name = 'name';
            } else if (loader?.type === 'MANY_TO_ONE') {

                if (loader.inputType === 'CASCADE') {
                    // @ts-ignore
                    column.renderFormItem = ((item, {type, defaultRender, ...rest}, form) => {
                        const loader: SchemaLoaderType = item.originProps.loader;
                        console.log(rest)
                        if (loader) {
                            return (<FormCascader width={item.originProps.width}
                                                  dataRequest={{url: '/' + loader.code + '/select', params: {level: 1}}}
                                                  level={loader.level}/>);
                        } else {
                            return null;
                        }
                    });
                } else if (loader.inputType === 'LOOKUP') {
                    // @ts-ignore
                    // column.valueType = 'lookup_';

                    // more data todo
                    dataRequest.url = '/' + loader.code + '/select';
                    dataNames.id = loader.idKey || 'id';
                    dataNames.name = loader.nameKey || 'name';
                } else {
                    dataRequest.url = '/' + loader.code + '/select';
                    dataNames.id = loader.idKey || 'id';
                    dataNames.name = loader.nameKey || 'name';
                }
            }

            column = {...column, request: selectRequest(dataRequest, dataNames)}
        }

    });
}
