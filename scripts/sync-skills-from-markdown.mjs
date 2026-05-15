import fs from "node:fs";
import path from "node:path";

const sourceDir = "C:\\Users\\cnico\\OneDrive\\Desktop\\APPLICANT\\skills";
const outputDir = path.resolve(process.cwd(), "public", "skills");
const outputFile = path.join(outputDir, "skills.json");

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeSkill(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function parseMarkdownSkills(markdown) {
  const lines = String(markdown || "").split(/\r?\n/);
  const skills = [];
  for (const line of lines) {
    const bullet = line.match(/^\s*[-*+]\s+(.+)\s*$/);
    const heading = line.match(/^\s{0,3}#{1,6}\s+(.+)\s*$/);
    const raw = bullet?.[1] || heading?.[1] || "";
    const skill = normalizeSkill(raw.replace(/`/g, ""));
    if (!skill) continue;
    if (skill.length > 80) continue;
    if (!skills.some((item) => item.toLowerCase() === skill.toLowerCase())) {
      skills.push(skill);
    }
  }
  return skills;
}

function toCategoryName(fileName) {
  const base = path.basename(fileName, ".md");
  return base
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function main() {
  if (!fs.existsSync(sourceDir)) {
    console.error(`Source folder not found: ${sourceDir}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(sourceDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md"))
    .map((entry) => entry.name);

  const categories = files.map((name) => {
    const fullPath = path.join(sourceDir, name);
    const content = fs.readFileSync(fullPath, "utf8");
    return {
      category: toCategoryName(name),
      fileName: name,
      skills: ensureArray(parseMarkdownSkills(content)),
    };
  });

  const dedupedCategories = categories.filter((item) => item.skills.length > 0);
  const allSkills = [...new Set(dedupedCategories.flatMap((item) => item.skills))];

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(
    outputFile,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        sourceDir,
        categories: dedupedCategories,
        allSkills,
      },
      null,
      2
    )
  );

  console.log(
    `Generated ${outputFile} from ${files.length} markdown file(s), ${allSkills.length} skill(s).`
  );
}

main();
