export function formatSiblingDetails(details = [], names = [], spouseLabel) {
  const siblings = details.length
    ? details
    : names.map((name) => ({ name }))

  return siblings.map((sibling) => {
    const parts = []
    if (sibling.age !== '' && sibling.age !== null && sibling.age !== undefined) {
      parts.push(`Age ${sibling.age}`)
    }
    if (sibling.occupation) parts.push(sibling.occupation)
    if (sibling.maritalStatus) parts.push(sibling.maritalStatus)
    if (sibling.spouseName) {
      const spouse = [sibling.spouseName]
      if (sibling.spouseAge !== '' && sibling.spouseAge !== null && sibling.spouseAge !== undefined) {
        spouse.push(`Age ${sibling.spouseAge}`)
      }
      if (sibling.spouseOccupation) spouse.push(sibling.spouseOccupation)
      parts.push(`${spouseLabel}: ${spouse.join(', ')}`)
    }
    const name = sibling.name || 'Name not provided'
    return parts.length ? `${name} (${parts.join('; ')})` : name
  }).filter(Boolean).join(', ')
}
