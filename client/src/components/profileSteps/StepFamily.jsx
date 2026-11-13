import { useLanguage } from '../../context/LanguageContext.jsx'

function siblingDetails(value, kind) {
  const detailsKey = kind === 'brothers' ? 'brotherDetails' : 'sisterDetails'
  const namesKey = kind === 'brothers' ? 'brotherNames' : 'sisterNames'
  const savedDetails = value[detailsKey] ?? []
  const names = value[namesKey] ?? []
  const savedCount = value[kind] === '' || value[kind] === null || value[kind] === undefined
    ? savedDetails.length || names.length
    : Number(value[kind])
  const count = Math.min(savedCount, 20)
  return Array.from({ length: count }, (_, index) => savedDetails[index] ?? ({
    name: names[index] ?? '',
    age: '',
    occupation: '',
    maritalStatus: '',
    spouseName: '',
    spouseAge: '',
    spouseOccupation: '',
  }))
}
export default function StepFamily({ value = {}, onChange, disabled, gender }) {
  const { t } = useLanguage()
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value })
  const siblingKeys = (kind) => kind === 'brothers'
    ? { details: 'brotherDetails', names: 'brotherNames' }
    : { details: 'sisterDetails', names: 'sisterNames' }
  const setSiblingCount = (kind) => (e) => {
    const count = e.target.value
    const keys = siblingKeys(kind)
    const siblings = siblingDetails(value, kind)
    const nextDetails = Array.from(
      { length: count === '' ? 0 : Math.min(Math.max(Number(count), 0), 20) },
      (_, index) => siblings[index] ?? {
        name: '',
        age: '',
        occupation: '',
        maritalStatus: '',
        spouseName: '',
        spouseAge: '',
        spouseOccupation: '',
      }
    )
    onChange({
      ...value,
      [kind]: count,
      [keys.details]: nextDetails,
      [keys.names]: nextDetails.map((sibling) => sibling.name ?? ''),
    })
  }
  const setSiblingField = (kind, index, field, selectedValue) => {
    const keys = siblingKeys(kind)
    const siblings = [...siblingDetails(value, kind)]
    siblings[index] = {
      ...siblings[index],
      [field]: selectedValue,
      ...(field === 'maritalStatus' && selectedValue !== 'married'
        ? { spouseName: '', spouseAge: '', spouseOccupation: '' }
        : {}),
    }
    onChange({
      ...value,
      [keys.details]: siblings,
      [keys.names]: siblings.map((sibling) => sibling.name ?? ''),
    })
  }
  const renderSiblingFields = (kind, label) => siblingDetails(value, kind).map((sibling, index) => (
    <div className="field field-full sibling-detail-fields" key={`${kind}-${index}`}>
      <h4>{t(label)} {index + 1}</h4>
      <div className="form-grid">
        <div className="field">
          <label htmlFor={`${kind}-${index}-name`}>{t('Name')}</label>
          <input id={`${kind}-${index}-name`} className="form-input" maxLength={100}
            value={sibling.name ?? ''} onChange={(e) => setSiblingField(kind, index, 'name', e.target.value)}
            disabled={disabled} />
        </div>
        <div className="field">
          <label htmlFor={`${kind}-${index}-age`}>{t('Age')}</label>
          <input id={`${kind}-${index}-age`} type="number" className="form-input" min={0} max={120} step={1}
            value={sibling.age ?? ''} onChange={(e) => setSiblingField(kind, index, 'age', e.target.value)}
            disabled={disabled} />
        </div>
        <div className="field">
          <label htmlFor={`${kind}-${index}-occupation`}>{t('Occupation')}</label>
          <input id={`${kind}-${index}-occupation`} className="form-input" maxLength={100}
            value={sibling.occupation ?? ''}
            onChange={(e) => setSiblingField(kind, index, 'occupation', e.target.value)} disabled={disabled} />
        </div>
        <div className="field">
          <label htmlFor={`${kind}-${index}-married`}>{t('Marital status')}</label>
          <select id={`${kind}-${index}-married`} className="form-input"
            value={sibling.maritalStatus ?? ''}
            onChange={(e) => setSiblingField(kind, index, 'maritalStatus', e.target.value)} disabled={disabled}>
            <option value="">{t('Select…')}</option>
            <option value="unmarried">Unmarried</option>
            <option value="married">Married</option>
          </select>
        </div>
        {sibling.maritalStatus === 'married' && (
          <>
            <div className="field">
              <label htmlFor={`${kind}-${index}-spouse-name`}>
                {t(kind === 'sisters' ? "Husband's name" : "Wife's name")}
              </label>
              <input id={`${kind}-${index}-spouse-name`} className="form-input" maxLength={100}
                value={sibling.spouseName ?? ''}
                onChange={(e) => setSiblingField(kind, index, 'spouseName', e.target.value)} disabled={disabled} />
            </div>
            <div className="field">
              <label htmlFor={`${kind}-${index}-spouse-age`}>
                {t(kind === 'sisters' ? "Husband's age" : "Wife's age")}
              </label>
              <input id={`${kind}-${index}-spouse-age`} type="number" className="form-input" min={0} max={120} step={1}
                value={sibling.spouseAge ?? ''}
                onChange={(e) => setSiblingField(kind, index, 'spouseAge', e.target.value)} disabled={disabled} />
            </div>
            <div className="field">
              <label htmlFor={`${kind}-${index}-spouse-occupation`}>
                {t(kind === 'sisters' ? "Husband's occupation" : "Wife's occupation")}
              </label>
              <input id={`${kind}-${index}-spouse-occupation`} className="form-input" maxLength={100}
                value={sibling.spouseOccupation ?? ''}
                onChange={(e) => setSiblingField(kind, index, 'spouseOccupation', e.target.value)}
                disabled={disabled} />
            </div>
          </>
        )}
      </div>
    </div>
  ))

  const previewRows = [
    ...(value.fatherName ? [{
      key: 'father',
      name: value.fatherName,
      age: value.fatherAge,
      relation: t(`Father of ${gender === 'female' ? 'bride' : 'groom'}`),
      occupation: value.fatherOccupation,
    }] : []),
    ...(value.motherName ? [{
      key: 'mother',
      name: value.motherName,
      age: value.motherAge,
      relation: t(`Mother of ${gender === 'female' ? 'bride' : 'groom'}`),
      occupation: value.motherOccupation,
    }] : []),
    ...siblingDetails(value, 'brothers').flatMap((sibling, index) => {
      const rows = sibling.name ? [{
        name: sibling.name,
        age: sibling.age,
        relation: t(`Brother of ${gender === 'female' ? 'bride' : 'groom'}`),
        occupation: sibling.occupation,
      }] : []
      if (sibling.maritalStatus === 'married' && sibling.spouseName) {
        rows.push({
          name: sibling.spouseName,
          age: sibling.spouseAge,
          relation: t("Brother's wife (sister-in-law)"),
          occupation: sibling.spouseOccupation,
        })
      }
      return rows.map((row) => ({ ...row, key: `brother-${index}-${row.relation}` }))
    }),
    ...siblingDetails(value, 'sisters').flatMap((sibling, index) => {
      const rows = sibling.name ? [{
        name: sibling.name,
        age: sibling.age,
        relation: t(`Sister of ${gender === 'female' ? 'bride' : 'groom'}`),
        occupation: sibling.occupation,
      }] : []
      if (sibling.maritalStatus === 'married' && sibling.spouseName) {
        rows.push({
          name: sibling.spouseName,
          age: sibling.spouseAge,
          relation: t("Sister's husband (brother-in-law)"),
          occupation: sibling.spouseOccupation,
        })
      }
      return rows.map((row) => ({ ...row, key: `sister-${index}-${row.relation}` }))
    }),
  ]

  return (
    <div className="form-grid">
      <div className="field">
        <label htmlFor="f-fo">{t("Father's name")}</label>
        <input id="f-fo" className="form-input" maxLength={100}
          value={value.fatherName ?? ''} onChange={set('fatherName')} disabled={disabled} />
      </div>

      <div className="field">
        <label htmlFor="f-mo">{t("Mother's name")}</label>
        <input id="f-mo" className="form-input" maxLength={100}
          value={value.motherName ?? ''} onChange={set('motherName')} disabled={disabled} />
      </div>

      <div className="field">
        <label htmlFor="f-foc">{t("Father's occupation")}</label>
        <input id="f-foc" className="form-input" maxLength={100}
          value={value.fatherOccupation ?? ''} onChange={set('fatherOccupation')} disabled={disabled} />
      </div>

      <div className="field">
        <label htmlFor="f-moc">{t("Mother's occupation")}</label>
        <input id="f-moc" className="form-input" maxLength={100}
          value={value.motherOccupation ?? ''} onChange={set('motherOccupation')} disabled={disabled} />
      </div>

      <div className="field">
        <label htmlFor="f-fa">{t("Father's age")}</label>
        <input id="f-fa" type="number" className="form-input" min={18} max={120} step={1}
          value={value.fatherAge ?? ''} onChange={set('fatherAge')} disabled={disabled} />
      </div>

      <div className="field">
        <label htmlFor="f-ma">{t("Mother's age")}</label>
        <input id="f-ma" type="number" className="form-input" min={18} max={120} step={1}
          value={value.motherAge ?? ''} onChange={set('motherAge')} disabled={disabled} />
      </div>

      <div className="field">
        <label htmlFor="f-b">{t('Brothers')}</label>
        <input id="f-b" type="number" className="form-input" min={0} max={20} step={1}
          value={value.brothers ?? ''} onChange={setSiblingCount('brothers')} disabled={disabled} />
        <span className="hint">{t('Married or unmarried — total count.')}</span>
      </div>

      {renderSiblingFields('brothers', 'Brother')}

      <div className="field">
        <label htmlFor="f-s">{t('Sisters')}</label>
        <input id="f-s" type="number" className="form-input" min={0} max={20} step={1}
          value={value.sisters ?? ''} onChange={setSiblingCount('sisters')} disabled={disabled} />
      </div>

      {renderSiblingFields('sisters', 'Sister')}

      <div className="field field-full">
        <h3>{t('Family preview')}</h3>
        <div className="sibling-preview-wrap">
          <table className="sibling-preview">
            <thead>
              <tr>
                <th scope="col">{t('Sr. No.')}</th>
                <th scope="col">{t('Name')}</th>
                <th scope="col">{t('Age')}</th>
                <th scope="col">{t('Relation with bride/groom')}</th>
                <th scope="col">{t('Occupation')}</th>
              </tr>
            </thead>
            <tbody>
              {previewRows.length ? previewRows.map((row, index) => (
                <tr key={row.key}>
                  <td>{index + 1}</td>
                  <td>{row.name}</td>
                  <td>{row.age === '' || row.age === null || row.age === undefined ? '—' : row.age}</td>
                  <td>{row.relation}</td>
                  <td>{row.occupation || '—'}</td>
                </tr>
              )) : (
                <tr><td colSpan="5">{t('Enter parent or sibling details to preview them here.')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="field">
        <label htmlFor="f-native">{t('Native place')}</label>
        <input id="f-native" className="form-input" maxLength={120}
          placeholder={t('e.g. Warangal, Telangana')}
          value={value.nativePlace ?? ''} onChange={set('nativePlace')} disabled={disabled} />
      </div>
    </div>
  )
}
