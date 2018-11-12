import {StringObject} from '../../types';
import {RequestOptions} from './types';
const got = require('got');
const fakeUA = require('random-fake-useragent');
import {parse} from 'url';
import {stringify} from 'querystring';

import getError, {ERROR_CODE} from '../error';

export default async function(options: RequestOptions): Promise<any> {
  const {method = 'get', timeout = 5000} = options;
  const urlObj = parse(options.url, true);
  const qs = stringify(Object.assign(urlObj.query, options.query));
  const headers: StringObject = {
    'User-Agent': fakeUA.getRandom()
  };

  let body: string = "";

  if (method === 'post') {
    switch (options.type) {
      case 'form':
        headers['Content-Type'] =
          'application/x-www-form-urlencoded; charset=UTF-8';
        body = stringify(options.body);
        break;

      case 'json':
      default:
        headers['Content-Type'] = 'application/json; charset=UTF-8';
        body = JSON.stringify(options.body);
        break;
    }

    headers['Content-Length'] = String(Buffer.byteLength(body));
  }

  Object.assign(headers, options.headers);

  const responseType = options.responseType || 'json';

  const GotOpts = {
    baseUrl: urlObj.protocol + '//' + urlObj.hostname,
    query: qs,
    headers,
    timeout,
    body
    // json: true
  };

  let result = await got[method](urlObj.pathname, GotOpts)
    .then((res: any) => {
      if (responseType === 'json') {
        try {
          return JSON.parse(res.body);
        } catch (e) {
          // 与浏览器端保持一致，在无法解析成 json 时报错
          return getError(ERROR_CODE.API_SERVER_ERROR);
        }
      } else {
        return res.body;
      }
    })
    .catch((err: any) => {
      // 超时
      if (err.statusCode === 408) {
        return getError(ERROR_CODE.NETWORK_TIMEOUT);
      }
      // 内置的翻译接口都以 200 作为响应码，所以不是 200 的一律视为错误
      if (err.statusCode !== 200) {
        return getError(ERROR_CODE.API_SERVER_ERROR);
      }
      return getError(ERROR_CODE.NETWORK_ERROR, err.statusMessage);
    });

  if(result instanceof Error){
    throw result
  }

  return result;
  // new Promise((resolve, reject) => {

  //   const req = (urlObj.protocol === 'https:' ? requestHTTPs : requestHTTP)(
  //     httpOptions,
  //     res => {
  //       // 超时
  //       if (res.statusCode === 408) {
  //         reject(getError(ERROR_CODE.NETWORK_TIMEOUT))
  //         return
  //       }
  //       // 内置的翻译接口都以 200 作为响应码，所以不是 200 的一律视为错误
  //       if (res.statusCode !== 200) {
  //         reject(getError(ERROR_CODE.API_SERVER_ERROR))
  //         return
  //       }

  //       res.setEncoding('utf8')
  //       let rawData = ''
  //       res.on('data', (chunk: string) => {
  //         rawData += chunk
  //       })
  //       res.on('end', () => {
  //         // Node.js 端只支持 json，其余都作为 text 处理
  //         if (responseType === 'json') {
  //           try {
  //             resolve(JSON.parse(rawData))
  //           } catch (e) {
  //             // 与浏览器端保持一致，在无法解析成 json 时报错
  //             reject(getError(ERROR_CODE.API_SERVER_ERROR))
  //           }
  //         } else {
  //           resolve(rawData)
  //         }
  //       })
  //     }
  //   )

  //   req.on('error', e => {
  //     reject(getError(ERROR_CODE.NETWORK_ERROR, e.message))
  //   })

  //   req.end(body)
  // })
}
