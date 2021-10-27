import {Tree} from "antd";
import React, {useEffect, useState} from "react";
import {DataNode, EventDataNode} from "rc-tree/lib/interface";

import {TreeProps} from "antd/lib/tree/Tree";
import {treeRequest} from "../../services/base/ServiceRequest";
import {DataNamesType, DataRequestType} from "../../types";

export const PageTree = (props: {
  dataRequest: DataRequestType,
  dataNames?: DataNamesType,
  rootNode?: DataNode
  level?: number
} & TreeProps) => {

  const {dataRequest, dataNames} = props;
  const level = props.level || 6;
  const parentKey = dataNames?.parent || 'parentId';
  let {rootNode} = props;

  const [dataNode, setDataNode] = useState<DataNode[]>([])

  useEffect(() => {
    treeRequest(dataRequest, dataNames, level)
      .then((records) => {
        if (records && records.length > 0) {
          if (rootNode) {
            rootNode.isLeaf = false;
            rootNode.children = records;
            setDataNode([rootNode]);
          } else {
            setDataNode([...records]);
          }
        }
      });
  }, [])

  const loadData = (treeNode: EventDataNode) => {

    return new Promise<void>(resolve => {

      console.log('----------------tree loadData->' + treeNode.key)

      if (!treeNode.isLeaf && !treeNode.children) {
        treeNode.loading = true
        let params = {[parentKey]: treeNode.key};

        treeRequest({...dataRequest, params: params}, dataNames, level)
          .then((records) => {
            treeNode.loading = false;
            setDataNode(origin => updateTreeData(origin, treeNode.key, records));
          });
      }
      resolve();
    });
  }

  // 接口无返回level时，递归判断可加载的层级
  const hasLeaf = (curr: DataNode, l: number) => {
    l++;
    curr.children?.map((next) => {
      if (l >= level) {
        next.isLeaf = true;
        hasLeaf(next, l);
      }
    })
  }

  function updateTreeData(list: DataNode[], key: React.Key, children: DataNode[], currLevel?: number): DataNode[] {
    return list.map(node => {

      if (node.key === key) {
        return {
          ...node,
          children,
        };
      }
      if (node.children) {
        return {
          ...node,
          children: updateTreeData(node.children, key, children),
        };
      }
      return node;
    });
  }

  const renderTreeNodes = (data:DataNode[]) => {
    if (!Array.isArray(data)) {
      return <></>;
    }
    return data.map(item => {
      if (item.children && item.children.length > 0) {
        return (
          <Tree.TreeNode title={item.title} key={item.key}>
            {renderTreeNodes(item.children)}
          </Tree.TreeNode>
        );
      }
      // @ts-ignore
      return <Tree.TreeNode title={item.title} key={item.key} {...item} />;
    });
  };

  console.log('----------------------------tree render')

  return (
    dataNode && dataNode.length>0 ? <Tree
      treeData={dataNode}
      loadData={loadData}
      onSelect={props.onSelect}
      onCheck={props.onCheck}
      autoExpandParent={true}
    >
      {/*{renderTreeNodes(dataNode)}*/}
    </Tree>:<></>
  );

}
