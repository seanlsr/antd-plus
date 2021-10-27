import {WaterMark} from "@ant-design/pro-layout";
import {WaterMarkProps} from "@ant-design/pro-layout/lib/components/WaterMark";
import {PropsWithChildren} from "react";

const PageWaterMark = (props: PropsWithChildren<WaterMarkProps>) => {
  return <WaterMark {...props} content={props.content||'统一水印设置'}>
    {props.children}
  </WaterMark>
}

export default PageWaterMark;
