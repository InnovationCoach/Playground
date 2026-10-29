import { describe, it, expect } from 'vitest';
import { sanitizeCell, generateInventoryCsv } from '../src/features/admin/inventory/csv.js';
import { calculateDimensions } from '../src/features/admin/inventory/imageCompress.js';
import {
  ASSET_CATEGORIES,
  ASSET_STATUSES,
  ASSET_CONDITIONS
} from '../src/features/admin/inventory/inventoryStore.js';
import { parseRoute, hrefFor } from '../src/app/routes.js';
import { consolePermissions } from '../src/app/roles.js';

describe('Inventory CSV Export (csv.js)', () => {
  describe('sanitizeCell', () => {
    it('returns empty string for null and undefined', () => {
      expect(sanitizeCell(null)).toBe('');
      expect(sanitizeCell(undefined)).toBe('');
    });

    it('neutralizes spreadsheet formula injection (=, +, -, @, \\t, \\r)', () => {
      expect(sanitizeCell('=1+1')).toBe("'=1+1");
      expect(sanitizeCell('=SUM(A1:B10)')).toBe("'=SUM(A1:B10)");
      expect(sanitizeCell('+cmd|')).toBe("'+cmd|");
      expect(sanitizeCell('-100')).toBe("'-100");
      expect(sanitizeCell('@alert')).toBe("'@alert");
      expect(sanitizeCell('\tpayload')).toBe("'\tpayload");
      expect(sanitizeCell('\rpayload')).toBe("\"'\rpayload\""); // contains \r so quoted
    });

    it('escapes quotes and wraps in quotes when containing commas or newlines (RFC 4180)', () => {
      expect(sanitizeCell('Hello, World')).toBe('"Hello, World"');
      expect(sanitizeCell('Line 1\nLine 2')).toBe('"Line 1\nLine 2"');
      expect(sanitizeCell('She said "hello"')).toBe('"She said ""hello"""');
      expect(sanitizeCell('Normal text')).toBe('Normal text');
    });
  });

  describe('generateInventoryCsv', () => {
    it('generates CSV with UTF-8 BOM, headers, and formatted data rows', () => {
      const mockAssets = [
        {
          id: 'asset_1',
          name: '3D Printer',
          assetTag: 'TAG-001',
          category: 'maker_tools',
          status: 'available',
          condition: 'good',
          quantity: 2,
          quantityAvailable: 2,
          location: 'Lab A',
          serial: 'SN-9988',
          currentLoan: null,
          purchaseDate: '2026-01-15',
          purchaseValue: 499.99,
          currency: 'USD',
          notes: 'Works well',
          photo: { url: 'https://storage/asset_1.jpg' },
          updatedAt: new Date('2026-03-01T10:00:00Z')
        },
        {
          id: 'asset_2',
          name: '=Calculator, Plus',
          assetTag: '+TAG-002',
          category: 'electronics',
          status: 'in_use',
          condition: 'fair',
          quantity: 1,
          quantityAvailable: 0,
          location: 'Room 101',
          serial: null,
          currentLoan: {
            borrowerType: 'coach',
            borrowerName: 'Don',
            dueDate: '2026-04-01'
          },
          purchaseDate: null,
          purchaseValue: null,
          currency: 'USD',
          notes: 'In check-out',
          photo: null,
          updatedAt: '2026-03-02T12:00:00Z'
        }
      ];

      const csv = generateInventoryCsv(mockAssets);

      // Must start with UTF-8 BOM (\uFEFF)
      expect(csv.startsWith('\uFEFF')).toBe(true);

      const lines = csv.replace('\uFEFF', '').split('\r\n');
      expect(lines.length).toBe(3); // header + 2 rows

      // Headers check
      expect(lines[0]).toContain('Name');
      expect(lines[0]).toContain('Asset Tag');
      expect(lines[0]).toContain('Category');
      expect(lines[0]).toContain('Quantity Available');

      // Formula injection check in row 2
      expect(lines[2]).toContain("\"'=Calculator");
      expect(lines[2]).toContain("'+TAG-002");
      expect(lines[2]).toContain('Don');
    });
  });
});

describe('Image Sizing Math (imageCompress.js)', () => {
  it('keeps dimensions unchanged if long edge is <= 1600', () => {
    expect(calculateDimensions(800, 600, 1600)).toEqual({ width: 800, height: 600 });
    expect(calculateDimensions(1200, 1600, 1600)).toEqual({ width: 1200, height: 1600 });
    expect(calculateDimensions(1600, 900, 1600)).toEqual({ width: 1600, height: 900 });
  });

  it('scales landscape down proportionally when width > 1600', () => {
    const res = calculateDimensions(3200, 1800, 1600);
    expect(res.width).toBe(1600);
    expect(res.height).toBe(900);
  });

  it('scales portrait down proportionally when height > 1600', () => {
    const res = calculateDimensions(1800, 3600, 1600);
    expect(res.height).toBe(1600);
    expect(res.width).toBe(800);
  });

  it('scales large square images to 1600x1600', () => {
    const res = calculateDimensions(2400, 2400, 1600);
    expect(res.width).toBe(1600);
    expect(res.height).toBe(1600);
  });

  it('handles zero or negative inputs gracefully', () => {
    expect(calculateDimensions(0, 0, 1600)).toEqual({ width: 1, height: 1 });
  });
});

describe('Inventory Constants & Contracts', () => {
  it('defines all required categories per Section 3', () => {
    const expectedCategories = [
      'electronics',
      'robotics',
      'lab',
      'maker_tools',
      'computers',
      'av',
      'sports',
      'art',
      'furniture',
      'books',
      'other'
    ];
    expect(ASSET_CATEGORIES).toEqual(expectedCategories);
  });

  it('defines all required statuses and conditions', () => {
    expect(ASSET_STATUSES).toEqual(['available', 'in_use', 'needs_repair', 'retired']);
    expect(ASSET_CONDITIONS).toEqual(['new', 'good', 'fair', 'poor']);
  });
});

describe('Inventory Routes & Navigation (routes.js)', () => {
  it('parses inventory routes correctly', () => {
    expect(parseRoute('#/admin/inventory')).toEqual({
      screen: 'admin',
      page: 'inventory',
      subpage: 'list'
    });

    expect(parseRoute('#/admin/inventory/new')).toEqual({
      screen: 'admin',
      page: 'inventory',
      subpage: 'new'
    });

    expect(parseRoute('#/admin/inventory/asset_xyz123')).toEqual({
      screen: 'admin',
      page: 'inventory',
      subpage: 'detail',
      assetId: 'asset_xyz123'
    });
  });

  it('generates inventory hrefs correctly', () => {
    expect(hrefFor.inventory()).toBe('#/admin/inventory');
    expect(hrefFor.inventory('new')).toBe('#/admin/inventory/new');
    expect(hrefFor.inventory('detail', 'asset_456')).toBe('#/admin/inventory/asset_456');
  });
});

describe('Inventory Console Permissions (roles.js)', () => {
  it('grants full view, edit, loan permissions to admin', () => {
    const perms = consolePermissions('admin');
    expect(perms.viewInventory).toBe(true);
    expect(perms.editInventory).toBe(true);
    expect(perms.loanInventory).toBe(true);
  });

  it('grants view-only permissions to supervisor', () => {
    const perms = consolePermissions('supervisor');
    expect(perms.viewInventory).toBe(true);
    expect(perms.editInventory).toBe(false);
    expect(perms.loanInventory).toBe(false);
  });

  it('denies inventory permissions to non-console roles', () => {
    const teacherPerms = consolePermissions('teacher');
    expect(teacherPerms.viewInventory).toBe(false);
    expect(teacherPerms.editInventory).toBe(false);
    expect(teacherPerms.loanInventory).toBe(false);

    const studentPerms = consolePermissions('student');
    expect(studentPerms.viewInventory).toBe(false);
    expect(studentPerms.editInventory).toBe(false);
  });
});
