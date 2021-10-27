import {Tabs, TabsProps} from "antd";
import React, {Key, useState} from "react";
import {PageTabsType} from "../../hooks/usePageModel";

/**
 * 数据页面顶部Tab切换
 * @param props
 * @constructor
 */
export const PageCardTabs = (props: { pageModel: any,onChange?:(activeKey:string)=>void}) => {
  const {pageModel, onChange} = props;
  const pageTabsType: PageTabsType | undefined = pageModel.getPostionTabs('cardTab');
  const [activeKey, setActiveKey] = useState(pageTabsType?.activeKey);

  const onChangeHandle = (ak: string) => {
    pageModel.setTabsActiveKey('cardTab', ak);
    setActiveKey(ak);
    if (onChange) {
      onChange(ak);
    }
  }

  return pageTabsType ? <Tabs
    type={'card'}
    defaultActiveKey={activeKey}
    activeKey={activeKey}
    onChange={onChangeHandle}
  >
    {
      pageTabsType.appendFirst && <Tabs.TabPane tab={pageTabsType.appendFirst[0]}
                                                key={pageTabsType.appendFirst[1] as Key}/>
    }
    {
      pageTabsType.items.map((item) => {
        return <Tabs.TabPane tab={item.text} key={item.value as Key}/>
      })
    }
  </Tabs> : <></>

}
