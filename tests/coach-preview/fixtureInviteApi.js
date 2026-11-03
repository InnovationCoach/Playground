// Isolated UI fixtures only. No network request or real account creation.
export async function schoolRequest(method, path, options = {}) {
  if (method === 'GET' && path === '/api/coach/students/classes') return { items:[{id:'class-preview-a',name:'Climate Studio · Year 9'},{id:'class-preview-b',name:'Engineering Studio · Year 12'}] };
  if (method === 'POST' && path === '/api/coach/students') return { student:{...options.body,groupName:'Sample class'}, setupLink:'https://example.test/sample-only-setup-link',delivery:'manual' };
  throw new Error('Unavailable in this sample preview.');
}
