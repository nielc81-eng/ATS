import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PageFrame } from "../../components/layout/ShellPrimitives";
import TagInput from "../../components/recruiter/TagInput";
import UploadDropzone, {
  validateResumeFile,
} from "../../components/candidate/UploadDropzone";
import { useAuth } from "../../context/AuthContext";
import {
  createEmptyAsset,
  createEmptyEducation,
  createEmptyReference,
  createEmptyTraining,
  createEmptyWorkExperience,
  mergeResumeProfileIntoDraft,
  markManualOverride,
  normalizeCandidateProfileState,
  readCandidateProfileState,
  readStoredResumeProfile,
  writeCandidateProfileState,
  writeStoredResumeProfile,
} from "../../lib/candidateProfileStorage";
import {
  buildMockParsedData,
  buildResumeBaselineFromParsed,
} from "../../lib/resumeExtractionMocks";

const acceptedPhotoMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const acceptedAssetMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function cloneState(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

function formatDate(value) {
  if (!value) return "-";
  const asDate = new Date(value);
  return Number.isNaN(asDate.getTime())
    ? value
    : asDate.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });
}

function hasAllowedExtension(fileName = "", allowedExtensions = []) {
  const lower = fileName.toLowerCase();
  return allowedExtensions.some((extension) => lower.endsWith(extension));
}

function validatePhotoFile(file) {
  if (!file) {
    return { ok: false, message: "Please choose a photo file." };
  }

  if (!acceptedPhotoMimeTypes.has(file.type) && !hasAllowedExtension(file.name, [".jpg", ".jpeg", ".png", ".webp"])) {
    return { ok: false, message: "Use JPG, PNG, or WEBP images for the profile photo." };
  }

  return { ok: true };
}

function validateAssetFile(file) {
  if (!file) {
    return { ok: false, message: "Please choose a supporting asset file." };
  }

  if (!acceptedAssetMimeTypes.has(file.type) && !hasAllowedExtension(file.name, [".pdf", ".jpg", ".jpeg", ".png", ".webp"])) {
    return { ok: false, message: "Use PDF, JPG, PNG, or WEBP files for assets." };
  }

  return { ok: true };
}

function AccordionSection({ title, description, countLabel, open, onToggle, children }) {
  return (
    <section className="surface-card overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 text-left"
      >
        <div>
          <p className="text-sm font-semibold text-slate-900 sm:text-base">{title}</p>
          {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
        </div>
        <div className="flex flex-none items-center gap-3">
          {countLabel ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {countLabel}
            </span>
          ) : null}
          <span className="text-lg font-semibold text-slate-500">{open ? "-" : "+"}</span>
        </div>
      </button>

      {open ? <div className="p-6 sm:p-8">{children}</div> : null}
    </section>
  );
}

function Field({ label, id, value, onChange, type = "text", placeholder, required = false, error }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="ml-1 text-rose-600">*</span> : null}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={[
          "w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-100",
          error ? "border-rose-300 focus:border-rose-500" : "border-slate-300 focus:border-blue-600",
        ].join(" ")}
      />
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

function TextArea({ label, id, value, onChange, placeholder, required = false, error, rows = 4 }) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="ml-1 text-rose-600">*</span> : null}
      </label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={[
          "w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-2 focus:ring-blue-100",
          error ? "border-rose-300 focus:border-rose-500" : "border-slate-300 focus:border-blue-600",
        ].join(" ")}
      />
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

function RowCard({ children, onRemove }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">{children}</div>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
        >
          Remove
        </button>
      </div>
    </article>
  );
}

function InputGrid({ children }) {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

function defaultOpenState() {
  return {
    "Resume Extraction": true,
    "Personal Details": true,
    "Work Experience": false,
    "Education": false,
    "Skills": true,
    "Trainings and Certifications": false,
    "Professional Summary": true,
    "Assets": false,
    "Character References": false,
    "Other Personal Details": false,
  };
}

function validateProfile(profile) {
  const errors = {};
  const pd = profile.personalDetails || {};
  const requiredStringFields = [
    ["personalDetails.firstName", pd.firstName],
    ["personalDetails.lastName", pd.lastName],
    ["personalDetails.email", pd.email],
    ["personalDetails.mobileNumber", pd.mobileNumber],
    ["personalDetails.province", pd.province],
    ["personalDetails.city", pd.city],
    ["personalDetails.address", pd.address],
    ["personalDetails.gender", pd.gender],
    ["personalDetails.dateOfBirth", pd.dateOfBirth],
    ["personalDetails.birthPlace", pd.birthPlace],
    ["personalDetails.nationality", pd.nationality],
    ["personalDetails.civilStatus", pd.civilStatus],
    ["professionalSummary", profile.professionalSummary],
  ];

  requiredStringFields.forEach(([key, value]) => {
    if (!String(value || "").trim()) {
      errors[key] = "Required.";
    }
  });

  if (!Array.isArray(pd.preferredWorkLocations) || pd.preferredWorkLocations.length === 0) {
    errors["personalDetails.preferredWorkLocations"] = "Add at least one preferred work location.";
  }

  if (!Array.isArray(profile.skills) || profile.skills.length === 0) {
    errors.skills = "Add at least one skill.";
  }

  return errors;
}

function initialState(session) {
  const resumeProfile = readStoredResumeProfile(session?.email || "");
  const candidateProfileState = readCandidateProfileState(session?.email || "", session, resumeProfile);
  return normalizeCandidateProfileState(candidateProfileState, session, resumeProfile);
}

export default function CandidateEditProfile() {
  const { session } = useAuth();
  const [profileState, setProfileState] = useState(() => initialState(session));
  const [openSections, setOpenSections] = useState(() => defaultOpenState());
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [stage, setStage] = useState("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const timersRef = useRef([]);

  const profile = profileState.profile;
  const resumeProfile = profileState.resumeProfile;
  const savedAtLabel = useMemo(
    () => (profileState.savedAt ? formatDate(profileState.savedAt) : "Not saved yet"),
    [profileState.savedAt]
  );

  useEffect(() => {
    const nextState = initialState(session);
    setProfileState(nextState);
    setErrors({});
    setNotice("");
  }, [session?.email]);

  useEffect(() => {
    if (!session?.email) return;
    writeCandidateProfileState(session.email, profileState);
    writeStoredResumeProfile(session.email, profileState.resumeProfile);
  }, [profileState, session?.email]);

  useEffect(
    () => () => {
      timersRef.current.forEach((timer) => {
        window.clearTimeout(timer);
        window.clearInterval(timer);
      });
    },
    []
  );

  const updateProfile = (mutator, overridePath) => {
    setProfileState((prev) => {
      const next = cloneState(prev);
      mutator(next);
      if (overridePath) {
        next.profile = markManualOverride(next.profile, overridePath);
      }
      next.updatedAt = new Date().toISOString();
      return next;
    });
  };

  const updateProfileField = (path, value) => {
    updateProfile((draft) => {
      const [section, field] = path.includes(".") ? path.split(".") : [path, null];
      if (section === "personalDetails") {
        draft.profile.personalDetails[field] = value;
        return;
      }

      if (section === "otherPersonalDetails") {
        draft.profile.otherPersonalDetails[field] = value;
        return;
      }

      if (!field) {
        draft.profile[section] = value;
        return;
      }

      draft.profile[field] = value;
    }, path);
    setErrors((prev) => {
      if (!prev[path]) return prev;
      const next = { ...prev };
      delete next[path];
      return next;
    });
  };

  const handleResumeUpload = (file) => {
    const validation = validateResumeFile(file);
    if (!validation.ok) {
      setErrorMessage(validation.message);
      setStatusMessage("");
      setStage("idle");
      setUploadProgress(0);
      return;
    }

    timersRef.current.forEach((timer) => {
      window.clearTimeout(timer);
      window.clearInterval(timer);
    });
    timersRef.current = [];

    setErrorMessage("");
    setNotice("");
    setStatusMessage("Uploading resume and refreshing profile baseline...");
    setStage("uploading");
    setUploadProgress(0);

    const uploadInterval = window.setInterval(() => {
      setUploadProgress((prev) => {
        const next = Math.min(prev + 10, 100);

        if (next >= 100) {
          window.clearInterval(uploadInterval);
          setStage("parsing");
          setStatusMessage("Extracting profile data from resume...");

          const parseTimer = window.setTimeout(async () => {
            const parsed = buildMockParsedData(file.name);
            const baseline = buildResumeBaselineFromParsed(parsed);

            updateProfile((draft) => {
              draft.resumeProfile = baseline;
              draft.profile = mergeResumeProfileIntoDraft(draft.profile, baseline);
              draft.profile.manualOverrides = {
                ...(draft.profile.manualOverrides || {}),
                resumeProfile: true,
              };
            });

            if (session?.email) {
              writeStoredResumeProfile(session.email, baseline);
            }

            setStage("complete");
            setStatusMessage("Resume parsed. Review the profile fields below.");
            setNotice("Profile baseline refreshed from the uploaded resume.");
          }, 1200);

          timersRef.current.push(parseTimer);
        }

        return next;
      });
    }, 120);

    timersRef.current.push(uploadInterval);
  };

  const handlePhotoUpload = async (file) => {
    const validation = validatePhotoFile(file);
    if (!validation.ok) {
      setNotice(validation.message);
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    updateProfile(
      (draft) => {
        draft.profile.photo = {
          fileName: file.name,
          dataUrl,
          mimeType: file.type,
          uploadedAt: new Date().toISOString(),
        };
      },
      "photo"
    );
    setNotice("Photo updated.");
  };

  const handleAssetUpload = async (assetId, file) => {
    const validation = validateAssetFile(file);
    if (!validation.ok) {
      setNotice(validation.message);
      return;
    }

    const dataUrl = await readFileAsDataUrl(file);
    updateProfile(
      (draft) => {
        draft.profile.assets = draft.profile.assets.map((asset) =>
          asset.id === assetId
            ? {
                ...asset,
                fileName: file.name,
                dataUrl,
                notes: asset.notes || "Uploaded supporting asset.",
              }
            : asset
        );
      },
      "assets"
    );
    setNotice("Supporting asset attached.");
  };

  const handleSave = () => {
    const nextErrors = validateProfile(profile);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setNotice("Please complete the required fields before saving.");
      return;
    }

    setProfileState((prev) => ({
      ...prev,
      savedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    setErrors({});

    setNotice("Profile saved.");
  };

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const updateArrayItem = (sectionKey, itemId, updater) => {
    updateProfile((draft) => {
      draft.profile[sectionKey] = draft.profile[sectionKey].map((item) =>
        item.id === itemId ? updater(item) : item
      );
    }, sectionKey);
  };

  const addArrayItem = (sectionKey, factory) => {
    updateProfile((draft) => {
      draft.profile[sectionKey] = [...draft.profile[sectionKey], factory()];
    }, sectionKey);
  };

  const removeArrayItem = (sectionKey, itemId) => {
    updateProfile((draft) => {
      draft.profile[sectionKey] = draft.profile[sectionKey].filter((item) => item.id !== itemId);
      if (draft.profile[sectionKey].length === 0) {
        if (sectionKey === "workExperience") draft.profile[sectionKey] = [createEmptyWorkExperience()];
        if (sectionKey === "education") draft.profile[sectionKey] = [createEmptyEducation()];
        if (sectionKey === "trainings") draft.profile[sectionKey] = [createEmptyTraining()];
        if (sectionKey === "references") draft.profile[sectionKey] = [createEmptyReference()];
        if (sectionKey === "assets") draft.profile[sectionKey] = [createEmptyAsset()];
      }
    }, sectionKey);
  };

  const handlePreferredLocationChange = (locations) => {
    updateProfile((draft) => {
      draft.profile.personalDetails.preferredWorkLocations = locations;
    }, "personalDetails.preferredWorkLocations");
    setErrors((prev) => {
      if (!prev["personalDetails.preferredWorkLocations"]) return prev;
      const next = { ...prev };
      delete next["personalDetails.preferredWorkLocations"];
      return next;
    });
  };

  const handleUploadDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleResumeUpload(file);
  };

  const handleUploadSelect = (file) => {
    if (file) handleResumeUpload(file);
  };

  const addAsset = () => addArrayItem("assets", createEmptyAsset);

  const addWorkExperience = () => addArrayItem("workExperience", createEmptyWorkExperience);
  const addEducation = () => addArrayItem("education", createEmptyEducation);
  const addTraining = () => addArrayItem("trainings", createEmptyTraining);
  const addReference = () => addArrayItem("references", createEmptyReference);

  const profileIsComplete = Object.keys(errors).length === 0;

  return (
    <PageFrame size="narrow">
      <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="section-heading">Candidate Portal</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Edit Profile
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
              Review the extracted resume baseline, correct the required company fields, and
              keep your draft in sync as you go.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/candidate/dashboard"
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              Back to Dashboard
            </Link>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Save Profile
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Resume Baseline</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {resumeProfile?.fileName || "No resume uploaded"}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Saved</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{savedAtLabel}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Draft Status</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {profileIsComplete ? "Ready to save" : "Needs review"}
            </p>
          </div>
        </div>

        {notice ? (
          <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            {notice}
          </div>
        ) : null}
      </section>

      <section
        className={[
          "rounded-3xl border-2 border-dashed bg-white p-6 transition sm:p-8",
          dragActive ? "border-blue-500 bg-blue-50" : "border-slate-300",
        ].join(" ")}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setDragActive(false);
          }
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleUploadDrop}
      >
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <UploadDropzone
            dragActive={dragActive}
            disabled={stage === "uploading" || stage === "parsing"}
            onDragEnter={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setDragActive(false);
              }
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleUploadDrop}
            onFileSelected={handleUploadSelect}
          />

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="section-heading">Resume Extraction</p>
            <div className="mt-3 space-y-3 text-sm text-slate-600">
              <p>
                The uploaded resume becomes your baseline for skills, summary, and profile
                review.
              </p>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Baseline summary</p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {resumeProfile?.summary || "No extracted summary yet."}
                </p>
                <p className="mt-3 text-xs text-slate-500">
                  Skills: {resumeProfile?.skills?.length || 0} | Experience years:{" "}
                  {resumeProfile?.yearsExperience || 0}
                </p>
              </div>
              {statusMessage ? (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800">
                  {statusMessage}
                </div>
              ) : null}
              {errorMessage ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
                  {errorMessage}
                </div>
              ) : null}
              {stage === "uploading" ? (
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                    <span>Upload progress</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <AccordionSection
        title="Personal Details"
        description="Identity, contact information, and work location preferences."
        countLabel="Required"
        open={openSections["Personal Details"]}
        onToggle={() => toggleSection("Personal Details")}
      >
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="section-heading">Photo</p>
            <div className="mt-4 flex items-center gap-4">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-slate-200 bg-white">
                {profile.photo?.dataUrl ? (
                  <img
                    src={profile.photo.dataUrl}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-semibold text-slate-400">No photo</span>
                )}
              </div>
              <div className="space-y-2">
                <label className="inline-flex cursor-pointer rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900">
                  Upload Photo
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) handlePhotoUpload(file);
                      event.target.value = "";
                    }}
                  />
                </label>
                {profile.photo?.fileName ? (
                  <p className="text-xs text-slate-500">{profile.photo.fileName}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="First Name"
              id="firstName"
              value={profile.personalDetails.firstName}
              onChange={(event) =>
                updateProfileField("personalDetails.firstName", event.target.value)
              }
              required
              error={errors["personalDetails.firstName"]}
            />
            <Field
              label="Middle Name"
              id="middleName"
              value={profile.personalDetails.middleName}
              onChange={(event) =>
                updateProfileField("personalDetails.middleName", event.target.value)
              }
            />
            <Field
              label="Last Name"
              id="lastName"
              value={profile.personalDetails.lastName}
              onChange={(event) =>
                updateProfileField("personalDetails.lastName", event.target.value)
              }
              required
              error={errors["personalDetails.lastName"]}
            />
            <Field
              label="Email"
              id="email"
              type="email"
              value={profile.personalDetails.email}
              onChange={(event) =>
                updateProfileField("personalDetails.email", event.target.value)
              }
              required
              error={errors["personalDetails.email"]}
            />
            <Field
              label="Mobile Number"
              id="mobileNumber"
              value={profile.personalDetails.mobileNumber}
              onChange={(event) =>
                updateProfileField("personalDetails.mobileNumber", event.target.value)
              }
              required
              error={errors["personalDetails.mobileNumber"]}
            />
            <Field
              label="Gender"
              id="gender"
              value={profile.personalDetails.gender}
              onChange={(event) =>
                updateProfileField("personalDetails.gender", event.target.value)
              }
              required
              error={errors["personalDetails.gender"]}
            />
            <Field
              label="Province"
              id="province"
              value={profile.personalDetails.province}
              onChange={(event) =>
                updateProfileField("personalDetails.province", event.target.value)
              }
              required
              error={errors["personalDetails.province"]}
            />
            <Field
              label="City"
              id="city"
              value={profile.personalDetails.city}
              onChange={(event) =>
                updateProfileField("personalDetails.city", event.target.value)
              }
              required
              error={errors["personalDetails.city"]}
            />
            <Field
              label="Date of Birth"
              id="dateOfBirth"
              type="date"
              value={profile.personalDetails.dateOfBirth}
              onChange={(event) =>
                updateProfileField("personalDetails.dateOfBirth", event.target.value)
              }
              required
              error={errors["personalDetails.dateOfBirth"]}
            />
            <Field
              label="Birth Place"
              id="birthPlace"
              value={profile.personalDetails.birthPlace}
              onChange={(event) =>
                updateProfileField("personalDetails.birthPlace", event.target.value)
              }
              required
              error={errors["personalDetails.birthPlace"]}
            />
            <Field
              label="Nationality"
              id="nationality"
              value={profile.personalDetails.nationality}
              onChange={(event) =>
                updateProfileField("personalDetails.nationality", event.target.value)
              }
              required
              error={errors["personalDetails.nationality"]}
            />
            <Field
              label="Civil Status"
              id="civilStatus"
              value={profile.personalDetails.civilStatus}
              onChange={(event) =>
                updateProfileField("personalDetails.civilStatus", event.target.value)
              }
              required
              error={errors["personalDetails.civilStatus"]}
            />
            <Field
              label="Height"
              id="height"
              value={profile.personalDetails.height}
              onChange={(event) =>
                updateProfileField("personalDetails.height", event.target.value)
              }
            />
            <Field
              label="Weight"
              id="weight"
              value={profile.personalDetails.weight}
              onChange={(event) =>
                updateProfileField("personalDetails.weight", event.target.value)
              }
            />
            <Field
              label="Religion"
              id="religion"
              value={profile.personalDetails.religion}
              onChange={(event) =>
                updateProfileField("personalDetails.religion", event.target.value)
              }
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <TextArea
            label="Address"
            id="address"
            value={profile.personalDetails.address}
            onChange={(event) =>
              updateProfileField("personalDetails.address", event.target.value)
            }
            required
            rows={4}
            error={errors["personalDetails.address"]}
          />
          <div className="space-y-4">
            <TagInput
              id="preferred-work-locations"
              label="Preferred Work Locations"
              placeholder="Add a city or region"
              helperText="Add at least one preferred location."
              tags={profile.personalDetails.preferredWorkLocations || []}
              onChange={handlePreferredLocationChange}
            />
            {errors["personalDetails.preferredWorkLocations"] ? (
              <p className="-mt-2 text-xs text-rose-600">
                {errors["personalDetails.preferredWorkLocations"]}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field
            label="PAGIBIG"
            id="pagibig"
            value={profile.personalDetails.pagibig}
            onChange={(event) =>
              updateProfileField("personalDetails.pagibig", event.target.value)
            }
          />
          <Field
            label="PHILHEALTH"
            id="philhealth"
            value={profile.personalDetails.philhealth}
            onChange={(event) =>
              updateProfileField("personalDetails.philhealth", event.target.value)
            }
          />
          <Field
            label="SSS"
            id="sss"
            value={profile.personalDetails.sss}
            onChange={(event) =>
              updateProfileField("personalDetails.sss", event.target.value)
            }
          />
          <Field
            label="TIN"
            id="tin"
            value={profile.personalDetails.tin}
            onChange={(event) =>
              updateProfileField("personalDetails.tin", event.target.value)
            }
          />
        </div>
      </AccordionSection>

      <AccordionSection
        title="Work Experience"
        description="Add or refine past roles, dates, and key responsibilities."
        countLabel={`${profile.workExperience.length} entries`}
        open={openSections["Work Experience"]}
        onToggle={() => toggleSection("Work Experience")}
      >
        <div className="space-y-4">
          {profile.workExperience.map((item) => (
            <RowCard
              key={item.id}
              onRemove={() => removeArrayItem("workExperience", item.id)}
            >
              <InputGrid>
                <Field
                  label="Company"
                  id={`work-company-${item.id}`}
                  value={item.company}
                  onChange={(event) =>
                    updateArrayItem("workExperience", item.id, (current) => ({
                      ...current,
                      company: event.target.value,
                    }))
                  }
                />
                <Field
                  label="Role / Title"
                  id={`work-title-${item.id}`}
                  value={item.title}
                  onChange={(event) =>
                    updateArrayItem("workExperience", item.id, (current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                />
                <Field
                  label="Location"
                  id={`work-location-${item.id}`}
                  value={item.location}
                  onChange={(event) =>
                    updateArrayItem("workExperience", item.id, (current) => ({
                      ...current,
                      location: event.target.value,
                    }))
                  }
                />
                <Field
                  label="Start Date"
                  id={`work-start-${item.id}`}
                  type="date"
                  value={item.startDate}
                  onChange={(event) =>
                    updateArrayItem("workExperience", item.id, (current) => ({
                      ...current,
                      startDate: event.target.value,
                    }))
                  }
                />
                <Field
                  label="End Date"
                  id={`work-end-${item.id}`}
                  type="date"
                  value={item.endDate}
                  onChange={(event) =>
                    updateArrayItem("workExperience", item.id, (current) => ({
                      ...current,
                      endDate: event.target.value,
                    }))
                  }
                />
                <div>
                  <label
                    htmlFor={`work-current-${item.id}`}
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Current
                  </label>
                  <select
                    id={`work-current-${item.id}`}
                    value={item.current ? "Yes" : "No"}
                    onChange={(event) =>
                      updateArrayItem("workExperience", item.id, (current) => ({
                        ...current,
                        current: event.target.value === "Yes",
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </InputGrid>
              <div className="mt-4">
                <TextArea
                  label="Summary"
                  id={`work-summary-${item.id}`}
                  value={item.summary}
                  onChange={(event) =>
                    updateArrayItem("workExperience", item.id, (current) => ({
                      ...current,
                      summary: event.target.value,
                    }))
                  }
                  rows={4}
                />
              </div>
            </RowCard>
          ))}

          <button
            type="button"
            onClick={addWorkExperience}
            className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Add Work Experience
          </button>
        </div>
      </AccordionSection>

      <AccordionSection
        title="Education"
        description="Record schools, credentials, and study details."
        countLabel={`${profile.education.length} entries`}
        open={openSections["Education"]}
        onToggle={() => toggleSection("Education")}
      >
        <div className="space-y-4">
          {profile.education.map((item) => (
            <RowCard key={item.id} onRemove={() => removeArrayItem("education", item.id)}>
              <InputGrid>
                <Field
                  label="School"
                  id={`edu-school-${item.id}`}
                  value={item.school}
                  onChange={(event) =>
                    updateArrayItem("education", item.id, (current) => ({
                      ...current,
                      school: event.target.value,
                    }))
                  }
                />
                <Field
                  label="Degree"
                  id={`edu-degree-${item.id}`}
                  value={item.degree}
                  onChange={(event) =>
                    updateArrayItem("education", item.id, (current) => ({
                      ...current,
                      degree: event.target.value,
                    }))
                  }
                />
                <Field
                  label="Field of Study"
                  id={`edu-field-${item.id}`}
                  value={item.fieldOfStudy}
                  onChange={(event) =>
                    updateArrayItem("education", item.id, (current) => ({
                      ...current,
                      fieldOfStudy: event.target.value,
                    }))
                  }
                />
                <Field
                  label="Start Date"
                  id={`edu-start-${item.id}`}
                  type="date"
                  value={item.startDate}
                  onChange={(event) =>
                    updateArrayItem("education", item.id, (current) => ({
                      ...current,
                      startDate: event.target.value,
                    }))
                  }
                />
                <Field
                  label="End Date"
                  id={`edu-end-${item.id}`}
                  type="date"
                  value={item.endDate}
                  onChange={(event) =>
                    updateArrayItem("education", item.id, (current) => ({
                      ...current,
                      endDate: event.target.value,
                    }))
                  }
                />
              </InputGrid>
              <div className="mt-4">
                <TextArea
                  label="Notes"
                  id={`edu-notes-${item.id}`}
                  value={item.notes}
                  onChange={(event) =>
                    updateArrayItem("education", item.id, (current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>
            </RowCard>
          ))}

          <button
            type="button"
            onClick={addEducation}
            className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Add Education
          </button>
        </div>
      </AccordionSection>

      <AccordionSection
        title="Skills"
        description="Confirm your extracted skills and add any missing ones."
        countLabel={`${profile.skills.length} tags`}
        open={openSections["Skills"]}
        onToggle={() => toggleSection("Skills")}
      >
        <TagInput
          id="candidate-skills"
          label="Skills"
          placeholder="Type a skill and press Enter"
          helperText="Resume extraction prefilled this list. You can add or remove tags."
          tags={profile.skills}
          onChange={(next) => {
            updateProfile(
              (draft) => {
                draft.profile.skills = next;
              },
              "skills"
            );
            setErrors((prev) => {
              if (!prev.skills) return prev;
              const nextErrors = { ...prev };
              delete nextErrors.skills;
              return nextErrors;
            });
          }}
        />
        {errors.skills ? <p className="mt-2 text-xs text-rose-600">{errors.skills}</p> : null}
      </AccordionSection>

      <AccordionSection
        title="Trainings and Certifications"
        description="List courses, certifications, and short programs."
        countLabel={`${profile.trainings.length} entries`}
        open={openSections["Trainings and Certifications"]}
        onToggle={() => toggleSection("Trainings and Certifications")}
      >
        <div className="space-y-4">
          {profile.trainings.map((item) => (
            <RowCard key={item.id} onRemove={() => removeArrayItem("trainings", item.id)}>
              <InputGrid>
                <Field
                  label="Training / Certification"
                  id={`train-title-${item.id}`}
                  value={item.title}
                  onChange={(event) =>
                    updateArrayItem("trainings", item.id, (current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                />
                <Field
                  label="Provider"
                  id={`train-provider-${item.id}`}
                  value={item.provider}
                  onChange={(event) =>
                    updateArrayItem("trainings", item.id, (current) => ({
                      ...current,
                      provider: event.target.value,
                    }))
                  }
                />
                <Field
                  label="Completion Date"
                  id={`train-date-${item.id}`}
                  type="date"
                  value={item.completionDate}
                  onChange={(event) =>
                    updateArrayItem("trainings", item.id, (current) => ({
                      ...current,
                      completionDate: event.target.value,
                    }))
                  }
                />
                <Field
                  label="Certificate No."
                  id={`train-cert-${item.id}`}
                  value={item.certificateNo}
                  onChange={(event) =>
                    updateArrayItem("trainings", item.id, (current) => ({
                      ...current,
                      certificateNo: event.target.value,
                    }))
                  }
                />
              </InputGrid>
              <div className="mt-4">
                <TextArea
                  label="Notes"
                  id={`train-notes-${item.id}`}
                  value={item.notes}
                  onChange={(event) =>
                    updateArrayItem("trainings", item.id, (current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>
            </RowCard>
          ))}

          <button
            type="button"
            onClick={addTraining}
            className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Add Training / Certification
          </button>
        </div>
      </AccordionSection>

      <AccordionSection
        title="Professional Summary"
        description="Write a concise summary that matches the role you want."
        countLabel={profile.professionalSummary ? "Filled" : "Empty"}
        open={openSections["Professional Summary"]}
        onToggle={() => toggleSection("Professional Summary")}
      >
        <TextArea
          label="Summary"
          id="professionalSummary"
          value={profile.professionalSummary}
          onChange={(event) =>
            updateProfileField("professionalSummary", event.target.value)
          }
          required
          rows={6}
          error={errors.professionalSummary}
        />
      </AccordionSection>

      <AccordionSection
        title="Assets"
        description="Upload supporting files such as portfolio items or IDs."
        countLabel={`${profile.assets.length} files`}
        open={openSections["Assets"]}
        onToggle={() => toggleSection("Assets")}
      >
        <div className="space-y-4">
          {profile.assets.map((item) => (
            <RowCard key={item.id} onRemove={() => removeArrayItem("assets", item.id)}>
              <InputGrid>
                <Field
                  label="Asset Label"
                  id={`asset-label-${item.id}`}
                  value={item.label}
                  onChange={(event) =>
                    updateArrayItem("assets", item.id, (current) => ({
                      ...current,
                      label: event.target.value,
                    }))
                  }
                />
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    File
                  </label>
                  <label className="inline-flex cursor-pointer rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900">
                    Attach File
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) handleAssetUpload(item.id, file);
                        event.target.value = "";
                      }}
                    />
                  </label>
                  {item.fileName ? (
                    <p className="mt-2 text-xs text-slate-500">{item.fileName}</p>
                  ) : null}
                </div>
              </InputGrid>
              <div className="mt-4">
                <TextArea
                  label="Notes"
                  id={`asset-notes-${item.id}`}
                  value={item.notes}
                  onChange={(event) =>
                    updateArrayItem("assets", item.id, (current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>
              {item.dataUrl ? (
                <a
                  href={item.dataUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex text-sm font-semibold text-blue-700 hover:text-blue-600"
                >
                  View attached file
                </a>
              ) : null}
            </RowCard>
          ))}

          <button
            type="button"
            onClick={addAsset}
            className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Add Asset
          </button>
        </div>
      </AccordionSection>

      <AccordionSection
        title="Character References"
        description="Add contacts who can vouch for your work."
        countLabel={`${profile.references.length} entries`}
        open={openSections["Character References"]}
        onToggle={() => toggleSection("Character References")}
      >
        <div className="space-y-4">
          {profile.references.map((item) => (
            <RowCard key={item.id} onRemove={() => removeArrayItem("references", item.id)}>
              <InputGrid>
                <Field
                  label="Name"
                  id={`ref-name-${item.id}`}
                  value={item.name}
                  onChange={(event) =>
                    updateArrayItem("references", item.id, (current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
                <Field
                  label="Relationship"
                  id={`ref-relationship-${item.id}`}
                  value={item.relationship}
                  onChange={(event) =>
                    updateArrayItem("references", item.id, (current) => ({
                      ...current,
                      relationship: event.target.value,
                    }))
                  }
                />
                <Field
                  label="Phone"
                  id={`ref-phone-${item.id}`}
                  value={item.phone}
                  onChange={(event) =>
                    updateArrayItem("references", item.id, (current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                />
                <Field
                  label="Email"
                  id={`ref-email-${item.id}`}
                  value={item.email}
                  onChange={(event) =>
                    updateArrayItem("references", item.id, (current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                />
              </InputGrid>
              <div className="mt-4">
                <TextArea
                  label="Notes"
                  id={`ref-notes-${item.id}`}
                  value={item.notes}
                  onChange={(event) =>
                    updateArrayItem("references", item.id, (current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>
            </RowCard>
          ))}

          <button
            type="button"
            onClick={addReference}
            className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Add Reference
          </button>
        </div>
      </AccordionSection>

      <AccordionSection
        title="Other Personal Details"
        description="Add emergency contact and extra notes."
        countLabel="Optional"
        open={openSections["Other Personal Details"]}
        onToggle={() => toggleSection("Other Personal Details")}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Emergency Contact Name"
            id="emergencyContactName"
            value={profile.otherPersonalDetails.emergencyContactName}
            onChange={(event) =>
              updateProfileField("otherPersonalDetails.emergencyContactName", event.target.value)
            }
          />
          <Field
            label="Emergency Contact Relationship"
            id="emergencyContactRelationship"
            value={profile.otherPersonalDetails.emergencyContactRelationship}
            onChange={(event) =>
              updateProfileField(
                "otherPersonalDetails.emergencyContactRelationship",
                event.target.value
              )
            }
          />
          <Field
            label="Emergency Contact Phone"
            id="emergencyContactPhone"
            value={profile.otherPersonalDetails.emergencyContactPhone}
            onChange={(event) =>
              updateProfileField("otherPersonalDetails.emergencyContactPhone", event.target.value)
            }
          />
          <Field
            label="Emergency Contact Address"
            id="emergencyContactAddress"
            value={profile.otherPersonalDetails.emergencyContactAddress}
            onChange={(event) =>
              updateProfileField(
                "otherPersonalDetails.emergencyContactAddress",
                event.target.value
              )
            }
          />
        </div>

        <div className="mt-4">
          <TextArea
            label="Additional Notes"
            id="otherNotes"
            value={profile.otherPersonalDetails.notes}
            onChange={(event) =>
              updateProfileField("otherPersonalDetails.notes", event.target.value)
            }
            rows={4}
          />
        </div>
      </AccordionSection>

      <section className="surface-card p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="section-heading">Review</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">Save your draft</h2>
            <p className="mt-1 text-sm text-slate-600">
              Your draft is auto-saved locally, and the save button stamps the latest reviewed state.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Save Profile
          </button>
        </div>
      </section>
      </div>
    </PageFrame>
  );
}

