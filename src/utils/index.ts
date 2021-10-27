
import React from "react";
import {ProSchemaValueEnumMap, ProSchemaValueEnumType} from "@ant-design/pro-utils/lib/typing";
import {PresetColorType, PresetColorTypes} from "antd/lib/_util/colors";

/**
 * 获取Tag Color
 * @param i
 */
export const tagColor = (i: number): PresetColorType => {

  let length = PresetColorTypes.length;

  if (i < length) {
    return PresetColorTypes[i];
  } else {
    return PresetColorTypes[i % length];
  }

}


/**
 * 枚举转Map
 * <ProSchemaValueEnumMap>
 * @param enumClass 枚举类
 * @param colors 设置color
 */
export const enum2EnumMap = (enumClass: any, colors?: string[]): ProSchemaValueEnumMap => {

  let map: Map<React.ReactText, ProSchemaValueEnumType> = new Map<React.ReactText, ProSchemaValueEnumType>();
  let length = colors ? colors.length : 0;

  const keys = Object.keys(enumClass);
  keys.map(((value, index) => {
    const e = Reflect.get(enumClass, value);
    const desc = Reflect.get(e, 'desc');
    map.set(value, {text: desc, status: value, color: colors && length > index ? colors[index] : undefined})
  }))

  return map;
}

export const bool2EnumMap = (descs?: string[], colors?: string[]): ProSchemaValueEnumMap => {

  let map: Map<React.ReactText, ProSchemaValueEnumType> = new Map<React.ReactText, ProSchemaValueEnumType>();
  if (!colors) {
    colors = ['blue', 'grey-5'];
  }
  if (!descs) {
    descs = ['是', '否'];
  }

  const length = colors?.length;
  const status: string[] = ['true', 'false'];

  descs.map((desc, index) => {
    map.set(status[index], {
      text: desc,
      status: status[index],
      color: colors && length > index ? colors[index] : undefined
    })
  })

  return map;
}

export declare type EnumValue = {
  /** @name 值 */
  value: string;
  /** @name 文本 */
  text: string;
};

/**
 * 枚举转值数组
 * @param enumClass 枚举类
 * @param appendFirst 枚举类
 */
export const enum2Values = (enumClass: any, appendFirst: boolean | string[]): EnumValue[] => {

  let values: EnumValue[] = [];

  if (appendFirst) {
    if (typeof appendFirst === 'boolean') {
      values.push({value: '', text: '全部'})
    } else {
      values.push({value: appendFirst[1], text: appendFirst[0]})
    }
  }

  const keys = Object.keys(enumClass);
  keys.map(((value, index) => {
    const e = Reflect.get(enumClass, value);
    const desc = Reflect.get(e, 'desc');
    values.push({value: value, text: desc});
  }));

  return values;
}

/**
 * 从当前路由中获取约定的页面key和title
 * @param props
 */
export const usePage = (props: any) => {

  let {path} = props.route;

  if (path.startsWith('/')) {
    path = path.substr(1, path.indexOf('/', 1) - 1);
  } else {
    path = path.substr(0, path.indexOf('/') - 1);
  }

  return [path, props.route.title];
}
