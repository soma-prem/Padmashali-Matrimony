/**
 * Profile completion — recalculated on every save, 0-100.
 * Each group is scored: (filled required fields / total) * group weight.
 * Photos: 1 photo = 6%, each extra 3% more, capped at 12%.
 */
const FINAL_GROUPS = [
  {
    weight: 10,
    get: (d) => [d.basic?.name, d.basic?.gender, d.basic?.dateOfBirth, d.basic?.heightCm,
      d.basic?.weightKg, d.basic?.maritalStatus, d.basic?.motherTongue],
  },
  { weight: 5,  get: (d) => [d.basic?.aboutMe] },
  { weight: 9,  get: (d) => [d.community?.religion, d.community?.caste, d.community?.gotra] },
  { weight: 9,  get: (d) => [d.educationCareer?.highestQualification, d.educationCareer?.college, d.educationCareer?.fieldOfStudy] },
  { weight: 9,  get: (d) => [d.educationCareer?.occupation, d.educationCareer?.company, d.educationCareer?.annualIncome] },
  { weight: 9,  get: (d) => [d.family?.fatherName, d.family?.fatherOccupation, d.family?.fatherAge,
    d.family?.motherName, d.family?.motherOccupation, d.family?.motherAge, d.family?.brothers, d.family?.sisters,
    d.family?.nativePlace] },
  { weight: 9,  get: (d) => [d.lifestyleLocation?.diet, d.lifestyleLocation?.smoking,
    d.lifestyleLocation?.drinking, d.lifestyleLocation?.hobbies] },
  { weight: 9,  get: (d) => [
    d.lifestyleLocation?.city,
    d.lifestyleLocation?.state,
    d.lifestyleLocation?.country,
    d.lifestyleLocation?.willingToRelocate,
    ...(d.lifestyleLocation?.willingToRelocate ? [d.lifestyleLocation?.relocationLocation] : []),
  ] },
  { weight: 9,  get: (d) => [d.contact?.mobile, d.contact?.whatsapp, d.contact?.email, d.contact?.address] },
  { weight: 12, get: (d) => Array.from({ length: Math.min(d.photoCount ?? 0, 2) }) }, // 1 photo = 6, 2+ = 12
]

export function computeCompletion(snapshot, photoCount) {
  let earned = 0
  let possible = 0
  for (const group of FINAL_GROUPS) {
    possible += group.weight
    if (group.weight === 12) {
      earned += Math.min((photoCount ?? 0) * 6, 12)
      continue
    }
    const fields = group.get(snapshot)
    const filled = fields.filter((v) => v !== null && v !== undefined && v !== '').length
    earned += Math.round((filled / fields.length) * group.weight)
  }
  return possible ? Math.round((earned / possible) * 100) : 0
}
