const COMPLETION_GROUPS = [
  (profile) => [
    profile.basic?.name,
    profile.basic?.gender,
    profile.basic?.dateOfBirth,
    profile.basic?.heightCm,
    profile.basic?.weightKg,
    profile.basic?.maritalStatus,
    profile.basic?.motherTongue,
  ],
  (profile) => [profile.basic?.aboutMe],
  (profile) => [
    profile.community?.religion,
    profile.community?.caste,
    profile.community?.gotra,
  ],
  (profile) => [
    profile.educationCareer?.highestQualification,
    profile.educationCareer?.college,
    profile.educationCareer?.fieldOfStudy,
  ],
  (profile) => [
    profile.educationCareer?.occupation,
    profile.educationCareer?.company,
    profile.educationCareer?.annualIncome,
  ],
  (profile) => [
    profile.family?.fatherName,
    profile.family?.fatherOccupation,
    profile.family?.fatherAge,
    profile.family?.motherName,
    profile.family?.motherOccupation,
    profile.family?.motherAge,
    profile.family?.brothers,
    profile.family?.sisters,
    profile.family?.nativePlace,
  ],
  (profile) => [
    profile.lifestyleLocation?.diet,
    profile.lifestyleLocation?.smoking,
    profile.lifestyleLocation?.drinking,
    profile.lifestyleLocation?.hobbies,
  ],
  (profile) => [
    profile.lifestyleLocation?.city,
    profile.lifestyleLocation?.state,
    profile.lifestyleLocation?.country,
    profile.lifestyleLocation?.willingToRelocate,
    ...(profile.lifestyleLocation?.willingToRelocate
      ? [profile.lifestyleLocation?.relocationLocation]
      : []),
  ],
  (profile) => [
    profile.contact?.mobile,
    profile.contact?.whatsapp,
    profile.contact?.email,
    profile.contact?.address,
  ],
]

const GROUP_WEIGHT = 9
const BASIC_WEIGHT = 10
const ABOUT_WEIGHT = 5
const PHOTOS_WEIGHT = 12
const TOTAL_WEIGHT = BASIC_WEIGHT + ABOUT_WEIGHT + GROUP_WEIGHT * (COMPLETION_GROUPS.length - 2) + PHOTOS_WEIGHT

export function calculateProfileCompletion(profile, drafts) {
  const current = {
    ...profile,
    ...drafts,
    photos: profile.photos ?? [],
  }
  const basicFields = COMPLETION_GROUPS[0](current)
  const aboutFields = COMPLETION_GROUPS[1](current)
  const otherGroups = COMPLETION_GROUPS.slice(2)
  const groups = [
    { fields: basicFields, weight: BASIC_WEIGHT },
    { fields: aboutFields, weight: ABOUT_WEIGHT },
    ...otherGroups.map((getFields) => ({ fields: getFields(current), weight: GROUP_WEIGHT })),
  ]

  const earned = groups.reduce((total, { fields, weight }) => {
    const filled = fields.filter((value) => value !== null && value !== undefined && value !== '').length
    return total + Math.round((filled / fields.length) * weight)
  }, Math.min(current.photos.length * 6, PHOTOS_WEIGHT))

  return Math.min(100, Math.round((earned / TOTAL_WEIGHT) * 100))
}
