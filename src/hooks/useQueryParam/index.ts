
import { useHistory } from 'umi';


/**
 * 获取URL查询参数
 */
export const useQueryParam = (name: string): string | null => {
  const history = useHistory();
  let search = history.location.search;
  return getQueryParam(search, name);
}

export const getQueryParam = (search: string, name: string): string | null => {
  //console.log('search->' + search)
  let value = null;
  if (search && search.startsWith('?')) {
    const params = search.substr(1).split('&');
    params.map((param) => {
      const strings = param.split('=');
      if (strings.length === 2 && strings[0] === name) {
        value = strings[1];
      }
    })
  }
  return value;
}
