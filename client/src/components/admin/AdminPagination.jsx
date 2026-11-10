export default function AdminPagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  return (
    <div className="pagination">
      <button type="button" className="btn btn-outline btn-sm" disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}>
        ← Prev
      </button>
      <span>Page {page} of {totalPages}</span>
      <button type="button" className="btn btn-outline btn-sm" disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}>
        Next →
      </button>
    </div>
  )
}
