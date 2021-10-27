import {useRouteMatch} from 'umi';
import {PagePathType} from "../../types";


/**
 * 获取URL查询参数
 */
const usePagePaths = (): Map<PagePathType, string> => {
  const {path} = useRouteMatch();
  const pageKey = path.substring(path.startsWith('/') ? 1 : 0, path.indexOf('/'));

  let map: Map<PagePathType, string> = new Map();
  map.set("list", '/' + pageKey + '/list');
  map.set("page", '/' + pageKey + '/page');
  map.set("input", '/' + pageKey + '/input');
  map.set("create", '/' + pageKey + '/create');
  map.set("load", '/' + pageKey + '/load');
  map.set("edit", '/' + pageKey + '/edit');
  map.set("del", '/' + pageKey + '/del');
  map.set("lookup", '/' + pageKey + '/lookup');
  map.set("export", '/' + pageKey + '/export');
  map.set("select", '/' + pageKey + '/select');
  return map;
}

export default usePagePaths;
