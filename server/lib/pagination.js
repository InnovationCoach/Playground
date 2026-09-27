/**
 * Cursor-based pagination helper for lists:
 * { "items": [...], "nextPageToken": "opaque" | null, "total": 129 }
 */

export function encodeCursor(offset) {
  return Buffer.from(`o:${offset}`).toString('base64');
}

export function decodeCursor(token) {
  if (!token) return 0;
  try {
    const raw = Buffer.from(token, 'base64').toString('utf8');
    const m = /^o:(\d+)$/.exec(raw);
    return m ? parseInt(m[1], 10) : 0;
  } catch {
    return 0;
  }
}

export function paginateArray(rows, pageToken, pageSizeRaw = 30) {
  const pageSize = Math.min(Math.max(parseInt(pageSizeRaw, 10) || 30, 1), 100);
  const offset = decodeCursor(pageToken);
  const items = rows.slice(offset, offset + pageSize);
  const nextPageToken = offset + pageSize < rows.length ? encodeCursor(offset + pageSize) : null;
  return { items, nextPageToken, total: rows.length };
}
