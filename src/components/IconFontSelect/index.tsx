import {Select} from "antd";
import {createFromIconfontCN} from '@ant-design/icons';
import {SelectProps} from "antd/lib/select";

// 字体图标库
export const ICON_FONT_KEYS = ['icon-tuichu', 'icon-fanhui', 'icon-facebook', 'icon-twitter', 'icon-xiangyou', 'icon-right', 'icon-fanhui1', 'icon-fenxiang', 'icon-xiangxia', 'icon-xiangxia1', 'icon-xiangxia2', 'icon-suofang', 'icon-chexiao', 'icon-esc', 'icon-chexiao1', 'icon-iconfont', 'icon-suoding', 'icon-bianji', 'icon-shoucang2', 'icon-xinjian', 'icon-shoucang1', 'icon-gongkai', 'icon-gouwuche1', 'icon-zhongwen', 'icon-shangchuan', 'icon-yingwen', 'icon-gouwuche2', 'icon-shanchu', 'icon-xiazai', 'icon-sousuo', 'icon-dashang', 'icon-xiangmu', 'icon-fuzhidaima1', 'icon-wofaqi', 'icon-xiangmuchengyuan', 'icon-gengduo', 'icon-wocanyu', 'icon-lishi', 'icon-piliang', 'icon-shijian', 'icon-gonggao', 'icon-weixin', 'icon-weibo', 'icon-gerenzhanghu', 'icon-tianjiachengyuan', 'icon-soutubiao', 'icon-souren', 'icon-yuzhanghao', 'icon-biaoqing', 'icon-qq', 'icon-weibo1', 'icon-zuoxuan', 'icon-fangda2', 'icon-zuo2', 'icon-suoxiao', 'icon-you2', 'icon-suoxiao2', 'icon-youxuan2', 'icon-zuo', 'icon-zuoxuan2', 'icon-shang', 'icon-shang2', 'icon-youxuan', 'icon-xia2', 'icon-fangda', 'icon-xia', 'icon-you', 'icon-zhuanrang', 'icon-dianzan', 'icon-huifu', 'icon-saoyisao', 'icon-shuoming', 'icon-jinggao', 'icon-jieshi', 'icon-youxiang', 'icon-guanbi', 'icon-qunzhu', 'icon-fuzhichenggong', 'icon-weijiaru', 'icon-daishenhe', 'icon-shenhetongguo', 'icon-shenhejujue', 'icon-xinjiantubiaoku', 'icon-tubiaoku', 'icon-gouwuche', 'icon-huidingbu', 'icon-dianzan1', 'icon-morentouxiang', 'icon-paixu', 'icon-wenjian', 'icon-github', 'icon-yuzhanghao1', 'icon-weibo2', 'icon-you1', 'icon-zuo1', 'icon-shang1', 'icon-iconfont1', 'icon-gonggaodayi', 'icon-gongnengjieshao', 'icon-tubiaohuizhi', 'icon-daimayingyong', 'icon-zhifubao', 'icon-alibaba', 'icon-xiaomi', 'icon-zhongguodianxin', 'icon-tianmao', 'icon-alimama', 'icon-zhubajie', 'icon-tengxunwang', 'icon-aliyun', 'icon-taobaowang', 'icon-anzhuo', 'icon-ios', 'icon-pcduan', 'icon-qingchu', 'icon-huizhiguize', 'icon-zhizuoliucheng', 'icon-fuzhidaima', 'icon-fankui1', 'icon-weitijiao', 'icon-chexiao2'];

export const IconFont = createFromIconfontCN({
  scriptUrl: '//at.alicdn.com/t/font_8d5l8fzk5b87iudi.js',
});

export const IconFontSelect = (props: SelectProps<any>) => {
  return <Select {...props}>
    {
      ICON_FONT_KEYS.map((icon) => {
        return <Select.Option value={icon}><IconFont type={icon}/></Select.Option>
      })
    }
  </Select>
}
