import mammoth from 'mammoth';
import { getRequestBody, handleCors } from './_lib/routeHelper';

export default async function handler(req: any, res: any) {
  if (handleCors(req, res)) return;
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Phương thức không được hỗ trợ. Vui lòng sử dụng POST.' });
  }

  try {
    const body = getRequestBody(req);
    const { base64Data } = body || {};

    if (!base64Data) {
      return res.status(400).json({ error: 'Thiếu dữ liệu base64' });
    }

    const cleanBase64 = String(base64Data).replace(/^data:application\/[a-zA-Z0-9.-]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const result = await mammoth.extractRawText({ buffer });

    return res.status(200).json({ text: result.value || '' });
  } catch (error: any) {
    console.error('[parse-docx] Error parsing docx:', error);
    return res.status(500).json({ error: 'Không thể đọc nội dung file Word: ' + error.message });
  }
}
