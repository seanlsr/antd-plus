import {Select} from "antd";
import React from "react";
import {SearchProps} from "antd/lib/input";
import {EnumValue} from "../../utils";

/**
 * 返回包装的快捷关键字搜索
 * @param pageModel
 */
export const supportQuickSearch = (pageModel: any) => {

  return buildQuickSearch({
    onSearch: (value: string) => {
      pageModel.saveCustomParam('keyword_', value);
      pageModel.formRef.current?.submit();
    },
    options: pageModel.quickSearchOptions(),
    onTypeSelect: (value) => {
      pageModel.saveCustomParam('keywordType_', value);
    }
  })
}

export declare type QuickSearchParamType = {
  /**
   * 关键字
   */
  keyword_?: string,
  /**
   * 关键字类型（提交时，将会替换为绑定的提交参数）
   */
  keywordType_?: string
}

export const buildQuickSearch = (props: { width?: number, onSearch?: (keyword: string) => void } & QuickSearchBeforePropType): (SearchProps | false) => {

  // 未配置
  if (!props.options || props.options.length === 0) {
    return false;
  }

  const onlyOne = props.options.length === 1;

  let conf = {
    style: {width: props.width || 260},
    maxLength: 100,
    allowClear: true,
    onSearch: props.onSearch,
  }

  if (onlyOne) {
    return {
      ...conf,
      placeholder: '请输入' + props.options[0].text
    }
  } else {
    // 增加前置选项
    return {
      ...conf,
      addonBefore: (<QuickSearchBefore
        options={props.options}
        onTypeSelect={props.onTypeSelect}/>)
    }
  }
}

export declare type QuickSearchBeforePropType = {
  options?: EnumValue[] | undefined
  onTypeSelect?: (value: string) => void
}

const QuickSearchBefore = (props: QuickSearchBeforePropType) => {

  const {options, onTypeSelect} = props;
  const defaultValue = options && options.length > 0 ? options[0].value : '';
  if (onTypeSelect) {
    onTypeSelect(defaultValue);
  }

  return (
    <Select defaultValue={defaultValue} onSelect={(value) => {
      onTypeSelect && onTypeSelect(value);
    }}>
      {
        options?.map(
          (item, index) => {
            return <Select.Option key={index} value={item.value}>{item.text}</Select.Option>
          }
        )
      }
    </Select>
  );
}
