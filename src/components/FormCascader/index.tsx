import React, {useEffect, useState} from "react";
import {CascaderOptionType, CascaderValueType} from "antd/es/cascader";
import {DataNamesType, DataRequestType} from "../../types";
import {cascaderRequest} from "../../services/base/ServiceRequest";
import {Cascader} from "antd";

const FormCascader = (props: {
  width?: string | number
  dataRequest: DataRequestType,
  dataNames?: DataNamesType,
  value?: any,
  onChange?: (value: any) => void,
  level?: number
}) => {

  const {dataRequest, dataNames, value, onChange} = props;
  const level = props.level || 6;
  const idKey = dataNames?.id || 'id';
  const parentKey = dataNames?.parent || 'parentId';
  const childrenKey = dataNames?.children || 'children';
  let loadValue: boolean = value && value !== '' && level > 1;

  // 结果树
  const [options, setOptions] = useState<CascaderOptionType[]>([])
  // 初始默认值
  const [defValue, setDefValue] = useState<CascaderValueType>([]);

  useEffect(() => {
    cascaderRequest(dataRequest, dataNames, level)
      .then((records) => {
        if (records && records.length > 0) {
          setOptions([...records]);
        }
      });
  }, [])

  useEffect(() => {
    console.log('----------------------------cascader->' + value)
    if (loadValue) {
      const path = getPath(options, value);
      console.log(path);
      setDefValue(path);
    }
  }, [value,options])

  const buildDefValue = (id: any, ds: any[] | null, parentRecord: CascaderOptionType | null, records: CascaderOptionType[]): any[] => {
    let values: any[] = ds ? ds : [id];

    records.map((record) => {
      record.children?.map((child) => {
        if (child.value === id) {
          values.push(record.value);
        } else if (child.children) {
          buildDefValue(id, values, child, child.children);
        }
      });
    });

    return values;
  }

  const buildParent = (record: any, ps: any[]): any[] => {
    let parents: any[] = ps ? ps : [];
    let parent = Reflect.get(record, parentKey);
    if (parent) {
      parents.push(parent);
      buildParent(parent, parents)
    }

    return parents;
  }

  const getPath = (data: CascaderOptionType[], id: any): any[] => {
    let tempPath: any[] = [];
    try {
      data.map((node) => {
        getNodePath(node, tempPath, id);
      })
    } catch (e) {
      console.log(e, tempPath)
    }
    return tempPath;
  }

  const getNodePath = (node: CascaderOptionType, tempPath: any[], id: any) => {
    tempPath.push(node.value);
    if (node.value == id) {
      throw ("获得数据!");
    }
    if (node.children) {
      node.children.map(item => {
        getNodePath(item, tempPath, id)
      })
      tempPath.pop();
    } else {
      tempPath.pop();
    }
  }

  const onChangeHandle = (value: CascaderValueType, selectedOptions?: CascaderOptionType[]) => {
    if (onChange) {
      if (value) {
        onChange(value[value.length - 1]);
      }
      // TODO 返回对象数组
      // if (selectedOptions) {
      //   onChange(selectedOptions);
      // }
    }
  }

  const loadData = (selectedOptions?: CascaderOptionType[]) => {

    console.log('----------------cascader loadData->' + (selectedOptions ? selectedOptions[selectedOptions.length - 1].value : null))

    if (!selectedOptions) {
      return;
    }

    const targetOption = selectedOptions[selectedOptions.length - 1];

    if (!targetOption.isLeaf && !targetOption.children) {

      targetOption.loading = true
      let params = {[parentKey]: targetOption.value};

      cascaderRequest({...dataRequest, params: params}, dataNames, level)
        .then((records) => {
          targetOption.loading = false;
          setOptions(origin => updateTreeData(origin, targetOption.value, records));
        });
    }
  }

  const setLeaf = () => {
    options?.map((l1) => {
      if (level === 1) {
        l1.isLeaf = true;
      } else {
        hasLeaf(l1, 1);
      }
    });
  }

  // 接口无返回level时，递归判断可加载的层级
  const hasLeaf = (curr: CascaderOptionType, l: number) => {
    l++;
    curr.children?.map((next) => {
      if (l >= level) {
        next.isLeaf = true;
        hasLeaf(next, l);
      }
    })
  }

  function updateTreeData(list: CascaderOptionType[], value: string | number | undefined, children: CascaderOptionType[], currLevel?: number): CascaderOptionType[] {
    return list.map(node => {

      if (node.value === value) {
        return {
          ...node,
          children,
        };
      }
      if (node.children) {
        return {
          ...node,
          children: updateTreeData(node.children, value, children),
        };
      }
      return node;
    });
  }

  console.log('--------------------------------------cascader render->' + defValue);

  return (
    <Cascader defaultValue={defValue}
              style={{width: props.width}}
              options={options}
              loadData={loadData}
              onChange={onChangeHandle}
              changeOnSelect={true} allowClear={true}/>
  );

}

export default FormCascader;
