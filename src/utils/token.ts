import axios from 'axios';
import { g_utils } from '@/utils/bonProtocol';
export const transformToken = async (arrayBuffer: ArrayBuffer) => {
  // 如果是data URL格式，提取base64部分
  const res = await axios.post('https://xxz-xyzw.hortorgames.com/login/authuser', arrayBuffer, {
    params: {
      _seq: 1,
    },
    headers: {
      'Content-Type': 'application/octet-stream',
      "referrerPolicy": "no-referrer",
    },
    responseType: 'arraybuffer'
  })
  console.log('转换Token:', typeof res.data);

  const msg = g_utils.parse(res.data);
  console.log('解析结果:', msg);


  const data = msg.getData();
  console.log('数据内容:', data);

  const currentTime = Date.now();
  const sessId = currentTime * 100 + Math.floor(Math.random() * 100);
  const connId = currentTime + Math.floor(Math.random() * 10);

  return JSON.stringify({
    ...data,
    sessId,
    connId,
    isRestore: 0
  });
};