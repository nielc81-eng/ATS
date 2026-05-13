function normalizeText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

export function buildMockParsedData(fileName) {
  return {
    fileName,
    skills: [
      "React.js",
      "JavaScript (ES6+)",
      "Tailwind CSS",
      "REST API Integration",
      "UI Accessibility (WCAG)",
    ],
    experience: [
      "3+ years as Frontend Developer in SaaS products",
      "Built recruiter-facing dashboards with data visualizations",
      "Partnered with product and design in agile delivery cycles",
    ],
    education: [
      "BS Computer Science",
      "Frontend-focused bootcamp certification",
    ],
  };
}

export function extractYearsExperience(experienceItems) {
  if (!Array.isArray(experienceItems)) return 3;

  const match = experienceItems
    .map((item) => String(item || ""))
    .join(" ")
    .match(/(\d+)\+?\s*years?/i);

  if (!match) return 3;

  const value = Number.parseInt(match[1], 10);
  return Number.isFinite(value) && value > 0 ? value : 3;
}

export function buildResumeBaselineFromParsed(parsed = {}) {
  const fileName = normalizeText(parsed.fileName, "uploaded-resume.pdf");
  const skills = normalizeArray(parsed.skills)
    .map((skill) => String(skill || "").trim())
    .filter(Boolean);
  const experienceBullets = normalizeArray(parsed.experience)
    .map((item) => String(item || "").trim())
    .filter(Boolean);
  const educationBullets = normalizeArray(parsed.education)
    .map((item) => String(item || "").trim())
    .filter(Boolean);
  const yearsExperience = extractYearsExperience(experienceBullets);

  return {
    fileName,
    summary:
      skills.length > 0
        ? `Extracted ${skills.length} skills and about ${yearsExperience} years of experience from the uploaded resume.`
        : `Resume extracted from ${fileName}.`,
    skills,
    experienceBullets,
    educationBullets,
    yearsExperience,
    parsedAt: new Date().toISOString(),
  };
}
