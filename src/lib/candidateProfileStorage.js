const PROFILE_STORAGE_PREFIX = "candidate_profile_state_v1";
const RESUME_STORAGE_PREFIX = "candidate_resume_profile_v1";

function normalizeText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function createId(prefix) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 8)}`;
}

function splitDisplayName(name) {
  const parts = normalizeText(name, "").split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: "", middleName: "", lastName: "" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], middleName: "", lastName: "" };
  }

  return {
    firstName: parts[0],
    middleName: parts.length > 2 ? parts.slice(1, -1).join(" ") : "",
    lastName: parts[parts.length - 1],
  };
}

function readJson(key) {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJson(key, value) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getCandidateProfileStorageKey(email) {
  return `${PROFILE_STORAGE_PREFIX}:${normalizeText(email, "").toLowerCase()}`;
}

export function getCandidateResumeProfileKey(email) {
  return `${RESUME_STORAGE_PREFIX}:${normalizeText(email, "").toLowerCase()}`;
}

export function readStoredResumeProfile(email) {
  const key = getCandidateResumeProfileKey(email);
  const raw = readJson(key);
  if (!raw) return null;

  return normalizeResumeProfile(raw);
}

export function writeStoredResumeProfile(email, payload) {
  const key = getCandidateResumeProfileKey(email);
  writeJson(key, normalizeResumeProfile(payload));
}

export function normalizeResumeProfile(raw = {}) {
  return {
    fileName: normalizeText(raw.fileName, "uploaded-resume.pdf"),
    summary: normalizeText(raw.summary, ""),
    skills: normalizeArray(raw.skills)
      .map((skill) => String(skill || "").trim())
      .filter(Boolean),
    experienceBullets: normalizeArray(raw.experienceBullets)
      .map((item) => String(item || "").trim())
      .filter(Boolean),
    educationBullets: normalizeArray(raw.educationBullets)
      .map((item) => String(item || "").trim())
      .filter(Boolean),
    yearsExperience:
      typeof raw.yearsExperience === "number" && Number.isFinite(raw.yearsExperience)
        ? raw.yearsExperience
        : 0,
    parsedAt:
      typeof raw.parsedAt === "string" && raw.parsedAt.trim()
        ? raw.parsedAt.trim()
        : new Date().toISOString(),
  };
}

export function createEmptyWorkExperience() {
  return {
    id: createId("work"),
    company: "",
    title: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    summary: "",
  };
}

export function createEmptyEducation() {
  return {
    id: createId("edu"),
    school: "",
    degree: "",
    fieldOfStudy: "",
    startDate: "",
    endDate: "",
    notes: "",
  };
}

export function createEmptyTraining() {
  return {
    id: createId("train"),
    title: "",
    provider: "",
    completionDate: "",
    certificateNo: "",
    notes: "",
  };
}

export function createEmptyAsset() {
  return {
    id: createId("asset"),
    label: "",
    fileName: "",
    dataUrl: "",
    notes: "",
  };
}

export function createEmptyReference() {
  return {
    id: createId("ref"),
    name: "",
    relationship: "",
    phone: "",
    email: "",
    notes: "",
  };
}

function buildDraftFromSession(session, resumeProfile) {
  const name = splitDisplayName(session?.name || "");

  return {
    photo: {
      fileName: "",
      dataUrl: "",
      mimeType: "",
      uploadedAt: "",
    },
    personalDetails: {
      firstName: name.firstName,
      middleName: name.middleName,
      lastName: name.lastName,
      email: normalizeText(session?.email, "").toLowerCase(),
      mobileNumber: "",
      province: "",
      city: "",
      address: "",
      gender: "",
      preferredWorkLocations: [],
      dateOfBirth: "",
      birthPlace: "",
      height: "",
      weight: "",
      religion: "",
      nationality: "",
      civilStatus: "",
      pagibig: "",
      philhealth: "",
      sss: "",
      tin: "",
    },
    workExperience: [createEmptyWorkExperience()],
    education: [createEmptyEducation()],
    skills: normalizeArray(resumeProfile?.skills),
    trainings: [createEmptyTraining()],
    professionalSummary: normalizeText(resumeProfile?.summary, ""),
    assets: [],
    references: [createEmptyReference()],
    otherPersonalDetails: {
      emergencyContactName: "",
      emergencyContactRelationship: "",
      emergencyContactPhone: "",
      emergencyContactAddress: "",
      notes: "",
    },
    manualOverrides: {},
  };
}

export function buildInitialCandidateProfileState(session, resumeProfile) {
  const normalizedResume = normalizeResumeProfile(resumeProfile || {});
  const draft = buildDraftFromSession(session, normalizedResume);

  return {
    candidateEmail: normalizeText(session?.email, "").toLowerCase(),
    candidateName: normalizeText(session?.name, "Candidate"),
    resumeProfile: normalizedResume,
    profile: draft,
    savedAt: "",
    updatedAt: new Date().toISOString(),
  };
}

function normalizeRepeatableItems(rawItems, fallbackFactory, itemNormalizer) {
  const items = normalizeArray(rawItems).map((item) => itemNormalizer(item)).filter(Boolean);
  return items.length > 0 ? items : [fallbackFactory()];
}

function normalizeWorkExperience(raw = {}) {
  return {
    id: normalizeText(raw.id, createId("work")),
    company: normalizeText(raw.company, ""),
    title: normalizeText(raw.title, ""),
    location: normalizeText(raw.location, ""),
    startDate: normalizeText(raw.startDate, ""),
    endDate: normalizeText(raw.endDate, ""),
    current: Boolean(raw.current),
    summary: normalizeText(raw.summary, ""),
  };
}

function normalizeEducation(raw = {}) {
  return {
    id: normalizeText(raw.id, createId("edu")),
    school: normalizeText(raw.school, ""),
    degree: normalizeText(raw.degree, ""),
    fieldOfStudy: normalizeText(raw.fieldOfStudy, ""),
    startDate: normalizeText(raw.startDate, ""),
    endDate: normalizeText(raw.endDate, ""),
    notes: normalizeText(raw.notes, ""),
  };
}

function normalizeTraining(raw = {}) {
  return {
    id: normalizeText(raw.id, createId("train")),
    title: normalizeText(raw.title, ""),
    provider: normalizeText(raw.provider, ""),
    completionDate: normalizeText(raw.completionDate, ""),
    certificateNo: normalizeText(raw.certificateNo, ""),
    notes: normalizeText(raw.notes, ""),
  };
}

function normalizeAsset(raw = {}) {
  return {
    id: normalizeText(raw.id, createId("asset")),
    label: normalizeText(raw.label, ""),
    fileName: normalizeText(raw.fileName, ""),
    dataUrl: normalizeText(raw.dataUrl, ""),
    notes: normalizeText(raw.notes, ""),
  };
}

function normalizeReference(raw = {}) {
  return {
    id: normalizeText(raw.id, createId("ref")),
    name: normalizeText(raw.name, ""),
    relationship: normalizeText(raw.relationship, ""),
    phone: normalizeText(raw.phone, ""),
    email: normalizeText(raw.email, ""),
    notes: normalizeText(raw.notes, ""),
  };
}

export function normalizeCandidateProfileState(raw, session, resumeProfile) {
  const initial = buildInitialCandidateProfileState(session, resumeProfile);
  const rawState = normalizeObject(raw);
  const rawProfile = normalizeObject(rawState.profile);
  const rawResume = normalizeObject(rawState.resumeProfile);
  const rawSkills = normalizeArray(rawProfile.skills)
    .map((value) => normalizeText(value, ""))
    .filter(Boolean);

  const mergedProfile = {
    ...initial.profile,
    ...rawProfile,
    photo: {
      ...initial.profile.photo,
      ...normalizeObject(rawProfile.photo),
    },
    personalDetails: {
      ...initial.profile.personalDetails,
      ...normalizeObject(rawProfile.personalDetails),
      preferredWorkLocations: normalizeArray(
        rawProfile.personalDetails?.preferredWorkLocations
      )
        .map((value) => normalizeText(value, ""))
        .filter(Boolean),
    },
    workExperience: normalizeRepeatableItems(
      rawProfile.workExperience,
      createEmptyWorkExperience,
      normalizeWorkExperience
    ),
    education: normalizeRepeatableItems(
      rawProfile.education,
      createEmptyEducation,
      normalizeEducation
    ),
    skills: rawSkills.length > 0 ? rawSkills : initial.profile.skills,
    trainings: normalizeRepeatableItems(
      rawProfile.trainings,
      createEmptyTraining,
      normalizeTraining
    ),
    professionalSummary: normalizeText(rawProfile.professionalSummary, initial.profile.professionalSummary),
    assets: normalizeArray(rawProfile.assets).map(normalizeAsset).filter(Boolean),
    references: normalizeRepeatableItems(
      rawProfile.references,
      createEmptyReference,
      normalizeReference
    ),
    otherPersonalDetails: {
      ...initial.profile.otherPersonalDetails,
      ...normalizeObject(rawProfile.otherPersonalDetails),
    },
    manualOverrides: normalizeObject(rawProfile.manualOverrides),
  };

  return {
    ...initial,
    candidateEmail: initial.candidateEmail,
    candidateName: initial.candidateName,
    resumeProfile: {
      ...initial.resumeProfile,
      ...normalizeResumeProfile(rawResume),
    },
    profile: mergedProfile,
    savedAt: normalizeText(rawState.savedAt, initial.savedAt),
    updatedAt: normalizeText(rawState.updatedAt, initial.updatedAt),
  };
}

export function readCandidateProfileState(email, session, resumeProfile) {
  if (typeof window === "undefined") {
    return buildInitialCandidateProfileState(session, resumeProfile);
  }

  const key = getCandidateProfileStorageKey(email);
  const raw = readJson(key);
  if (!raw) {
    return buildInitialCandidateProfileState(session, resumeProfile);
  }

  return normalizeCandidateProfileState(raw, session, resumeProfile);
}

export function writeCandidateProfileState(email, state) {
  const key = getCandidateProfileStorageKey(email);
  writeJson(key, state);
}

export function markManualOverride(profile, path) {
  const next = normalizeObject(profile.manualOverrides);
  next[path] = true;
  return {
    ...profile,
    manualOverrides: next,
  };
}

export function mergeResumeProfileIntoDraft(profile, resumeProfile) {
  const normalizedResume = normalizeResumeProfile(resumeProfile);
  const nextProfile = {
    ...profile,
    professionalSummary:
      normalizeText(profile.professionalSummary, "") || normalizedResume.summary,
    skills:
      normalizeArray(profile.skills).length > 0
        ? profile.skills
        : normalizedResume.skills,
  };

  if (normalizeArray(profile.workExperience).length > 0) {
    const [firstExperience, ...rest] = profile.workExperience;
    nextProfile.workExperience = [
      {
        ...firstExperience,
        summary:
          normalizeText(firstExperience.summary, "") ||
          normalizedResume.experienceBullets.join(" "),
      },
      ...rest,
    ];
  }

  if (normalizeArray(profile.education).length > 0) {
    const [firstEducation, ...rest] = profile.education;
    nextProfile.education = [
      {
        ...firstEducation,
        notes:
          normalizeText(firstEducation.notes, "") ||
          normalizedResume.educationBullets.join(" "),
      },
      ...rest,
    ];
  }

  return nextProfile;
}
