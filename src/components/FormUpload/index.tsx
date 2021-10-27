import {ProFormDraggerProps} from "@ant-design/pro-form/lib/components/UploadButton";
import {ProFormUploadButton} from "@ant-design/pro-form";
import {RcFile, UploadProps} from "antd/lib/upload";
import {UPLOAD_URL} from "../../env/EnvVariableConfiguration";
import React, {useEffect, useState} from "react";
import {UploadFile} from "antd/lib/upload/interface";
import {ProSchemaValueEnumMap, ProSchemaValueEnumObj} from "@ant-design/pro-provider";

export declare type  FormUploadProps = ProFormDraggerProps
    & {
    value?: string,
    onChange?: (value: string) => string,
    valueType?: string,
    options?: ProSchemaValueEnumObj | ProSchemaValueEnumMap
};

// 字符值转UploadFile[]
const valueOf = (v: string | undefined): UploadFile[] => {

    if (v) {
        const valueArr = v.split(',');
        const uploadFiles: UploadFile[] = [];
        const timestamp = Date.now();
        valueArr.forEach((url, index) => {
            const uploadFile: UploadFile = {
                uid: `__AUTO__${timestamp}_${index}__`,
                name: url, // TODO name获取
                status: 'done',
                url,
                thumbUrl: url
            };
            uploadFiles.push(uploadFile);
        });
        return uploadFiles;
    }

    return [];
}

function FormUpload(props: FormUploadProps) {

    const {
        valueType = 'image',
        options = {
            size: {text: '文件大小', status: '1MB'},
            type: {text: '文件类型', status: ''},
            count: {text: '文件数量', status: '1'},
            option: {text: '文件选项', status: ''},
            tooltip: {text: '提示', status: undefined}
        },
        value,
        onChange,
        ...rest
    } = props;

    const [files, setFiles] = useState<UploadFile[]>([]);

    useEffect(() => {
        if (value && value !== '') {
            console.log(`FormUpload init->${value}`)
            // 设置初始值
            setFiles(() => valueOf(value));
        }
    }, []);

    // const isOss = UPLOAD_URL === 'oss';

    // @ts-ignore
    const max = options['count'].status;
    const tooltip = options['tooltip'].status;

    const beforeUpload = () => {

        // 压缩图片 todo
        // image限制大小和数量 params = {"200KB"/*允许大小*/, "0"/*裁剪宽高比。0 表示不限制；16/9 表示16比9；1/1 表示正方裁剪*/ ,"3","cut"} todo

        return (file: RcFile, FileList: RcFile[]): boolean => {
            // 限制类型和大小 TODO
            // console.log(file);
            return true;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-shadow
    const handleOnChange = (value: { fileList: UploadProps['fileList'] }) => {

        let urls: string = '';
        value.fileList?.map((file) => {
            if (file.status === 'done' && file.response) {
                const {thumbUrl, url} = file.response;
                if (thumbUrl && url) {
                    // eslint-disable-next-line no-param-reassign
                    file.thumbUrl = thumbUrl;
                    // eslint-disable-next-line no-param-reassign
                    file.url = url;
                }
            }
            if (file.url != null) {
                urls += `${file.url},`
            }
            return file;
        });

        if (onChange && urls.endsWith(',')) {
            // 传回表单值
            onChange(urls.substring(0, urls.length - 1));
        }

        // 每次都设置一下setFiles
        // @ts-ignore
        setFiles(() => value.fileList);

        return value.fileList;
    }

    return <ProFormUploadButton
        {...rest}
        max={max}
        value={files}
        fieldProps={{
            withCredentials: true,
            data: {type: 'antd'},
            listType: valueType.startsWith('image') ? 'picture-card' : 'text',
            beforeUpload: beforeUpload(),
            maxCount: max
        }}
        onChange={handleOnChange}
        action={UPLOAD_URL}
        extra={tooltip || rest.extra}
    />
}

export default FormUpload;
