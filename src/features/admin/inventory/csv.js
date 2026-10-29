/**
 * Equipment Inventory CSV Export utility.
 *
 * Requirements:
 * - UTF-8 with BOM (\uFEFF) so Excel (Windows & Mac) correctly displays multilingual text (English, Chinese, Thai).
 * - RFC 4180 quote, comma, and newline escaping.
 * - Formula injection neutralization: prefix any cell starting with '=', '+', '-', '@', '\t', '\r' with a single quote (').
 */

/**
 * Sanitizes a single cell to protect against spreadsheet formula injection (CSV injection).
 * If the string starts with =, +, -, @, \t, or \r, prefix with a single quote.
 *
 * @param {any} value
 * @returns {string}
 */
export function sanitizeCell(value) {
  if (value === null || value === undefined) return '';
  let str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  // Escape quotes and wrap in quotes if it contains commas, quotes, or newlines
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates CSV content from an array of asset records.
 *
 * @param {Array<object>} assets
 * @returns {string} CSV string starting with UTF-8 BOM
 */
export function generateInventoryCsv(assets = []) {
  const headers = [
    'Name',
    'Asset Tag',
    'Category',
    'Status',
    'Condition',
    'Quantity Total',
    'Quantity Available',
    'Location',
    'Serial Number',
    'Current Borrower Type',
    'Current Borrower Name',
    'Due Date',
    'Purchase Date',
    'Purchase Value',
    'Currency',
    'Notes',
    'Photo URL',
    'Updated At'
  ];

  const rows = assets.map((a) => {
    const loan = a.currentLoan || null;
    let updatedAtStr = '';
    if (a.updatedAt) {
      if (typeof a.updatedAt.toDate === 'function') {
        updatedAtStr = a.updatedAt.toDate().toISOString();
      } else if (a.updatedAt instanceof Date) {
        updatedAtStr = a.updatedAt.toISOString();
      } else {
        updatedAtStr = String(a.updatedAt);
      }
    }

    return [
      sanitizeCell(a.name),
      sanitizeCell(a.assetTag),
      sanitizeCell(a.category),
      sanitizeCell(a.status),
      sanitizeCell(a.condition),
      sanitizeCell(a.quantity),
      sanitizeCell(a.quantityAvailable),
      sanitizeCell(a.location),
      sanitizeCell(a.serial),
      sanitizeCell(loan?.borrowerType || ''),
      sanitizeCell(loan?.borrowerName || ''),
      sanitizeCell(loan?.dueDate || ''),
      sanitizeCell(a.purchaseDate),
      sanitizeCell(a.purchaseValue ?? ''),
      sanitizeCell(a.currency || ''),
      sanitizeCell(a.notes || ''),
      sanitizeCell(a.photo?.url || ''),
      sanitizeCell(updatedAtStr)
    ].join(',');
  });

  const bom = '\uFEFF';
  return bom + [headers.map(sanitizeCell).join(','), ...rows].join('\r\n');
}

/**
 * Triggers a browser download of the inventory CSV.
 *
 * @param {Array<object>} assets
 * @param {string} [filename]
 */
export function downloadInventoryCsv(assets, filename) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const finalFilename = filename || `inventory-${dateStr}.csv`;
  const csvContent = generateInventoryCsv(assets);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', finalFilename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
