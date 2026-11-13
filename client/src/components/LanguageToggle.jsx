import { useLanguage } from '../context/LanguageContext.jsx'

export default function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage()
  const nextLanguage = language === 'mr' ? 'English' : 'Marathi'

  return (
    <button
      type="button"
      className="language-toggle"
      onClick={toggleLanguage}
      aria-label={`Switch language to ${nextLanguage}`}
      title={`Switch language to ${nextLanguage}`}
    >
      {language === 'mr' ? 'English' : 'मराठी'}
    </button>
  )
}
