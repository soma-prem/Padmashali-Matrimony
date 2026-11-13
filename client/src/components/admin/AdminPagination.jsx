import { useLanguage } from '../../context/LanguageContext.jsx'

export default function AdminPagination({ page, totalPages, onPageChange }) {
  const { t } = useLanguage()
  if (totalPages <= 1) return null

  return (
    <div className="pagination">
      <button type="button" className="btn btn-outline btn-sm" disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}>
        ← {t('Prev')}
      </button>
      <span>{t('Page')} {page} {t('of')} {totalPages}</span>
      <button type="button" className="btn btn-outline btn-sm" disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}>
        {t('Next')} →
      </button>
    </div>
  )
}
