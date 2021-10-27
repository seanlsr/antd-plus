// @ts-nocheck
import BraftEditor, {BraftEditorProps, EditorState} from "braft-editor";
import {useEffect, useState} from "react";
import 'braft-editor/dist/index.css'
import {UPLOAD_URL} from "../../env/EnvVariableConfiguration";

export declare type FormEditor = BraftEditorProps & {
  value?: string,
  onChange?: (value: string) => string
}

const upload = (param) => {

  const serverURL = UPLOAD_URL;
  const xhr = new XMLHttpRequest
  const fd = new FormData()

  const successFn = (response) => {
    // 假设服务端直接返回文件上传后的地址
    // 上传成功后调用param.success并传入上传后的文件地址
    param.success({
      url: xhr.responseText,
      meta: {
        id: 'xxx',
        title: 'xxx',
        alt: 'xxx',
        loop: true, // 指定音视频是否循环播放
        autoPlay: true, // 指定音视频是否自动播放
        controls: true, // 指定音视频是否显示控制栏
        poster: 'http://xxx/xx.png', // 指定视频播放器的封面
      }
    })
  }

  const progressFn = (event) => {
    // 上传进度发生变化时调用param.progress
    param.progress(event.loaded / event.total * 100)
  }

  const errorFn = (response) => {
    // 上传发生错误时调用param.error
    param.error({
      msg: 'unable to upload.'
    })
  }

  xhr.upload.addEventListener("progress", progressFn, false)
  xhr.addEventListener("load", successFn, false)
  xhr.addEventListener("error", errorFn, false)
  xhr.addEventListener("abort", errorFn, false)

  fd.append('file', param.file)
  fd.append('type', 'braft-editor')
  xhr.withCredentials = true;
  xhr.open('POST', serverURL, true)
  xhr.send(fd)
}

// eslint-disable-next-line @typescript-eslint/no-redeclare
const FormEditor = (props: FormEditor) => {
  const {
    value,
    onChange,
    ...rest
  } = props;

  const [content, setContent] = useState<EditorState>();

  useEffect(() => {
    if (value && value !== '') {
      setContent(BraftEditor.createEditorState(value));
    }
  }, []);

  const handleEditorChange = (editorState: EditorState) => {
    setContent(() => editorState);
    const htmlContent = editorState.toHTML();
    if (onChange) {
      // console.log(`handleEditorChange->${htmlContent}`);
      onChange(htmlContent);
    }
  }

  const submitContent = async () => {
    const htmlContent = content.toHTML()
    if (onChange) {
      // console.log(`submitContent->${htmlContent}`);
      onChange(htmlContent);
    }
  }

  // console.log('------------------------FormEditor')

  return <BraftEditor
    {...rest}
    value={content}
    onChange={handleEditorChange}
    onSave={submitContent}
    media={{uploadFn: upload}}
  />
}

export default FormEditor;
