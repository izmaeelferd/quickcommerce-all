import { useT } from '../context/ConfigContext.jsx';

/**
 * columns: [{ key, label, render?(row), className? }]
 * pagination: { page, pages, total } ; onPage(page)
 */
export default function DataTable({ columns, rows, loading, pagination, onPage, empty = 'common.noData', rowKey = '_id', onRowClick }) {
  const t = useT();
  return (
    <div className="card overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-content/10">
          <thead className="bg-surface">
            <tr>{columns.map((c) => <th key={c.key} className={`table-th ${c.className || ''}`}>{c.label}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-content/5">
            {loading && (
              <tr><td className="table-td text-center text-content/50" colSpan={columns.length}>{t('common.loading')}</td></tr>
            )}
            {!loading && rows?.length === 0 && (
              <tr><td className="table-td py-10 text-center text-content/50" colSpan={columns.length}>{t(empty)}</td></tr>
            )}
            {!loading &&
              rows?.map((r) => (
                <tr key={r[rowKey]} className={`hover:bg-content/[0.03] ${onRowClick ? 'cursor-pointer' : ''}`} onClick={onRowClick ? () => onRowClick(r) : undefined}>
                  {columns.map((c) => <td key={c.key} className={`table-td ${c.className || ''}`}>{c.render ? c.render(r) : r[c.key]}</td>)}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between border-t border-content/10 px-4 py-3 text-sm">
          <span className="text-content/60">{t('common.pageOf', { page: pagination.page, pages: pagination.pages, total: pagination.total })}</span>
          <div className="flex gap-2">
            <button type="button" className="btn-outline px-3 py-1" disabled={pagination.page <= 1} onClick={() => onPage(pagination.page - 1)}>{t('common.prev')}</button>
            <button type="button" className="btn-outline px-3 py-1" disabled={pagination.page >= pagination.pages} onClick={() => onPage(pagination.page + 1)}>{t('common.next')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
