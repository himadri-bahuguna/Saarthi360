import React from 'react';

interface Column<T> {
  id: string;
  header: string;
  accessor?: keyof T;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  rowClassName?: (row: T) => string;
  keyExtractor?: (row: T) => string;
}

export type { Column };

export function DataTable<T>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'No records found.',
  rowClassName,
  keyExtractor,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b border-gray-100">
            {columns.map(col => (
              <th key={col.id} className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => {
            const key = keyExtractor ? keyExtractor(row) : idx.toString();
            const extraClass = rowClassName ? rowClassName(row) : '';
            return (
              <tr
                key={key}
                className={`border-b border-gray-50 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-blue-50' : 'hover:bg-gray-50'} ${idx % 2 === 0 ? '' : 'bg-gray-50/40'} ${extraClass}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map(col => (
                  <td key={col.id} className={`px-4 py-3 ${col.className || ''}`}>
                    {col.render
                      ? col.render(row)
                      : col.accessor
                      ? String(row[col.accessor] ?? '—')
                      : '—'}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
