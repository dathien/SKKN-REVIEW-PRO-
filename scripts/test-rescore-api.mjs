import assert from 'assert';

console.log('[test-rescore-api] Testing api/rescore-skkn.js serverless handler...');

const rescoreModule = await import('../api/rescore-skkn.js');
const handler = rescoreModule.default;

assert.strictEqual(typeof handler, 'function', 'Default export must be a function');

// 1. Test OPTIONS (CORS preflight)
{
  let statusCode = 0;
  let ended = false;
  const headers = {};
  const mockReq = { method: 'OPTIONS' };
  const mockRes = {
    setHeader: (k, v) => { headers[k] = v; },
    status: (code) => { statusCode = code; return mockRes; },
    end: () => { ended = true; }
  };

  await handler(mockReq, mockRes);
  assert.strictEqual(statusCode, 204, 'OPTIONS should return 204');
  assert.strictEqual(ended, true, 'OPTIONS should end response');
  assert.strictEqual(headers['Access-Control-Allow-Origin'], '*', 'CORS Allow Origin header present');
  console.log('✓ PASS: CORS preflight (OPTIONS) returns 204');
}

// 2. Test GET method (Method Not Allowed)
{
  let statusCode = 0;
  let jsonBody = null;
  const mockReq = { method: 'GET', headers: {} };
  const mockRes = {
    setHeader: () => {},
    status: (code) => { statusCode = code; return mockRes; },
    json: (data) => { jsonBody = data; return mockRes; }
  };

  await handler(mockReq, mockRes);
  assert.strictEqual(statusCode, 405, 'GET should return 405 Method Not Allowed');
  assert.strictEqual(jsonBody.success, false);
  console.log('✓ PASS: GET method rejected with 405 Method Not Allowed');
}

// 3. Test POST with empty content (Bad Request 400)
{
  let statusCode = 0;
  let jsonBody = null;
  const mockReq = {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: {
      previousResult: { evaluation: { score: 35.0 } },
      revisedNotes: '   '
    }
  };
  const mockRes = {
    setHeader: () => {},
    status: (code) => { statusCode = code; return mockRes; },
    json: (data) => { jsonBody = data; return mockRes; }
  };

  await handler(mockReq, mockRes);
  assert.strictEqual(statusCode, 400, 'Empty content should return 400');
  assert.strictEqual(jsonBody.success, false);
  assert.strictEqual(jsonBody.code, 'INVALID_ARGUMENT');
  assert.strictEqual(jsonBody.scoreChanged, false);
  assert.strictEqual(jsonBody.issuesChanged, false);
  console.log('✓ PASS: Empty revision content correctly rejected with 400 and score untouched');
}

// 4. Test Error handling when AI is unavailable / key missing or invalid
{
  let statusCode = 0;
  let jsonBody = null;
  const mockReq = {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: {
      previousResult: {
        evaluation: { score: 35.0 },
        rubricCriteria: [
          { criterionName: 'Tính mới', proposedScore: 10, maxScore: 25 },
          { criterionName: 'Tính khoa học', proposedScore: 15, maxScore: 35 }
        ],
        redTeamCards: [
          { id: 'rtc-1', issueDetected: 'Số liệu Bảng 2 mâu thuẫn', location: 'Mục II.1' }
        ]
      },
      revisedNotes: 'Đã đính chính số liệu Bảng 2 thành 82 học sinh đồng nhất.'
    }
  };
  const mockRes = {
    setHeader: () => {},
    status: (code) => { statusCode = code; return mockRes; },
    json: (data) => { jsonBody = data; return mockRes; }
  };

  await handler(mockReq, mockRes);
  // If GEMINI_API_KEY is configured in env, it might succeed or return status
  if (jsonBody.success) {
    assert.strictEqual(statusCode, 200, 'Successful rescore returns 200');
    assert.strictEqual(typeof jsonBody.newScore, 'number');
    assert.strictEqual(Array.isArray(jsonBody.issueComparisons), true);
    assert.strictEqual(Array.isArray(jsonBody.updatedCriteria), true);
    console.log('✓ PASS: Full Gemini rescore succeeded with 200 and structured rubric comparison');
  } else {
    // If API key is not configured or rate limited in test sandbox
    assert.strictEqual(jsonBody.success, false);
    assert.strictEqual(jsonBody.scoreChanged, false, 'Score must not change on AI failure');
    assert.strictEqual(jsonBody.issuesChanged, false, 'Issues must not change on AI failure');
    assert.strictEqual(jsonBody.previousScore, 35.0, 'Previous score must be preserved at 35.0');
    console.log(`✓ PASS: Handled gracefully with status ${statusCode}, score protected at 35.0`);
  }
}

// 5. Test Evaluation by Rubric Rules WITHOUT AI (method: 'rubric_rule')
{
  let statusCode = 0;
  let jsonBody = null;
  const mockReq = {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: {
      method: 'rubric_rule',
      previousResult: {
        score: 35.0,
        rubricCriteria: [
          { criterionName: 'Tính mới & sáng tạo', proposedScore: 10, maxScore: 20 },
          { criterionName: 'Tính khoa học & logic', proposedScore: 12, maxScore: 20 }
        ],
        redTeamCards: [
          { id: 'rtc-1', issueDetected: 'Số liệu Bảng 2 mâu thuẫn 85 học sinh vs 82', location: 'Bảng 2', status: 'Chưa xử lý' },
          { id: 'rtc-2', issueDetected: 'Thiếu minh chứng thực nghiệm', location: 'Mục III', status: 'Chưa xử lý' }
        ]
      },
      revisedNotes: 'BẢN ĐÍNH CHÍNH: Đã sửa và thống nhất số liệu Bảng 2 là 82 học sinh. Bổ sung Phụ lục 3 có biên bản và chữ ký xác nhận thực nghiệm.'
    }
  };
  const mockRes = {
    setHeader: () => {},
    status: (code) => { statusCode = code; return mockRes; },
    json: (data) => { jsonBody = data; return mockRes; }
  };

  await handler(mockReq, mockRes);
  assert.strictEqual(statusCode, 200, 'Rubric rule evaluation must return 200 without needing AI');
  assert.strictEqual(jsonBody.success, true);
  assert.strictEqual(jsonBody.evaluationMethod, 'rubric_rule', 'Must specify evaluationMethod as rubric_rule');
  assert.strictEqual(typeof jsonBody.newScore, 'number');
  assert.strictEqual(jsonBody.previousScore, 35.0, 'Previous score must match 35.0');
  assert.strictEqual(Array.isArray(jsonBody.issueComparisons), true);
  assert.strictEqual(Array.isArray(jsonBody.updatedCriteria), true);
  assert.strictEqual(jsonBody.fixedIssues.length > 0, true, 'At least 1 issue must be detected as fixed by rule match');
  assert.ok(jsonBody.justificationForChange.includes('không cần AI') || jsonBody.justificationForChange.includes('Quy tắc định lượng'));
  console.log('✓ PASS: Rubric rule evaluation (Without AI) succeeded with 200, deterministic scoring, and proper labeling');
}

console.log('[test-rescore-api] ALL RESCORE API TESTS PASSED SUCCESSFULLY! ✓');
