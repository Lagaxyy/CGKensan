import fs from "fs";
import path from "path";

type FrontMatterValue = string | string[];

export interface QCMOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QCMQuestion {
  type: "qcm";
  id: string;
  question: string;
  options: QCMOption[];
  explanation: string;
}

export interface OpenQuestion {
  type: "open";
  id: string;
  question: string;
  correction: string;
}

export type QuizQuestion = QCMQuestion | OpenQuestion;

export interface Quiz {
  slug: string;
  title: string;
  wikiRef: string;
  tags: string[];
  difficulty: string;
  created: string;
  questions: QuizQuestion[];
}

const QUIZ_DIR = path.join(process.cwd(), "docs", "quizzes");

/**
 * Parse le frontmatter YAML simple (clé: valeur ou clé: [liste])
 */
function parseFrontmatter(content: string): Record<string, FrontMatterValue> {
  const lines = content.split("\n").map((l) => l.trim());
  const meta: Record<string, FrontMatterValue> = {};

  for (const line of lines) {
    if (!line || line.startsWith("#")) continue;

    // Liste formatée [item1, item2]
    const listMatch = line.match(/^(\w+):\s*\[(.*)\]\s*$/);
    if (listMatch) {
      const key = listMatch[1];
      const items = listMatch[2]
        .split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
      meta[key] = items;
      continue;
    }

    // Clé: valeur simple
    const match = line.match(/^(\w+):\s*(.*)\s*$/);
    if (match) {
      const [, key, value] = match;
      meta[key] = value.replace(/^["']|["']$/g, "");
      continue;
    }
  }

  return meta;
}

/**
 * Parse un bloc de question QCM
 */
function parseQCMQuestion(block: string, id: string): QCMQuestion {
  const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);

  // Première ligne = question
  const question = lines[0].replace(/^##\s*/, "").trim();

  const options: QCMOption[] = [];
  let explanation = "";
  let inExplanation = false;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith(">")) {
      inExplanation = true;
      explanation += line.replace(/^>\s*/, "").replace(/^\*\*Explication\s*:\*\*\s*/, "");
      continue;
    }

    if (inExplanation) {
      explanation += " " + line.replace(/^>\s*/, "");
      continue;
    }

    const optMatch = line.match(/^-\s*\[([ x])\]\s*(.+)$/);
    if (optMatch) {
      options.push({
        id: `${id}-opt-${i}`,
        text: optMatch[2].trim(),
        isCorrect: optMatch[1].toLowerCase() === "x",
      });
    }
  }

  return {
    type: "qcm",
    id,
    question,
    options,
    explanation: explanation.trim(),
  };
}

/**
 * Parse un bloc de question ouverte
 */
function parseOpenQuestion(block: string, id: string): OpenQuestion {
  const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);

  const question = lines[0].replace(/^##\s*/, "").trim();

  let correction = "";
  let inCorrection = false;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith(">")) {
      inCorrection = true;
      correction += line.replace(/^>\s*/, "").replace(/^\*\*Correction\s*:\*\*\s*/, "");
      continue;
    }

    if (inCorrection) {
      correction += " " + line.replace(/^>\s*/, "");
    }
  }

  return {
    type: "open",
    id,
    question,
    correction: correction.trim(),
  };
}

/**
 * Parse le contenu markdown d'un fichier quiz
 */
export function parseQuizContent(content: string, slug: string): Quiz {
  // Extraire frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) {
    throw new Error(`Frontmatter manquant dans ${slug}`);
  }

  const meta = parseFrontmatter(fmMatch[1]);
  const body = fmMatch[2];

  const questions: QuizQuestion[] = [];

  // Split par sections # QCM et # Ouverte
  const qcmSection = body.match(/#\s*QCM\n([\s\S]*?)(?=\n#\s*Ouverte|\n#\s*ouverte|$)/i);
  const openSection = body.match(/#\s*Ouverte\n([\s\S]*?)$/i);

  if (qcmSection) {
    const qcmBlocks = qcmSection[1].split(/\n(?=##\s)/).filter((b) => b.trim());
    qcmBlocks.forEach((block, idx) => {
      questions.push(parseQCMQuestion(block, `${slug}-qcm-${idx}`));
    });
  }

  if (openSection) {
    const openBlocks = openSection[1].split(/\n(?=##\s)/).filter((b) => b.trim());
    openBlocks.forEach((block, idx) => {
      questions.push(parseOpenQuestion(block, `${slug}-open-${idx}`));
    });
  }

  return {
    slug,
    title: typeof meta.title === "string" ? meta.title : slug,
    wikiRef: typeof meta.wiki_ref === "string" ? meta.wiki_ref : "",
    tags: Array.isArray(meta.tags)
      ? meta.tags
      : typeof meta.tags === "string" && meta.tags
        ? [meta.tags]
        : [],
    difficulty:
      typeof meta.difficulty === "string" ? meta.difficulty : "medium",
    created:
      typeof meta.created === "string"
        ? meta.created
        : new Date().toISOString().split("T")[0],
    questions,
  };
}

/**
 * Charge un quiz depuis son slug
 */
export function loadQuiz(slug: string): Quiz {
  // slug format: "archisi/microservices" ou "mathematiques/propositions-connecteurs"
  const filePath = path.join(QUIZ_DIR, `${slug}.quiz.md`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Quiz non trouvé: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, "utf-8");
  return parseQuizContent(content, slug);
}

/**
 * Liste tous les quiz disponibles
 */
export function listQuizzes(): Array<{
  slug: string;
  title: string;
  tags: string[];
  difficulty: string;
  wikiRef: string;
  questionCount: number;
}> {
  const quizzes: Array<{
    slug: string;
    title: string;
    tags: string[];
    difficulty: string;
    wikiRef: string;
    questionCount: number;
  }> = [];

  if (!fs.existsSync(QUIZ_DIR)) {
    return quizzes;
  }

  function scanDir(dir: string, prefix: string = "") {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativeSlug = prefix ? `${prefix}/${entry.name.replace(/\.quiz\.md$/, "")}` : entry.name.replace(/\.quiz\.md$/, "");

      if (entry.isDirectory()) {
        scanDir(fullPath, relativeSlug);
      } else if (entry.name.endsWith(".quiz.md")) {
        try {
          const content = fs.readFileSync(fullPath, "utf-8");
          const quiz = parseQuizContent(content, relativeSlug);
          quizzes.push({
            slug: relativeSlug,
            title: quiz.title,
            tags: quiz.tags,
            difficulty: quiz.difficulty,
            wikiRef: quiz.wikiRef,
            questionCount: quiz.questions.length,
          });
        } catch (e) {
          console.error(`Erreur parsing quiz ${fullPath}:`, e);
        }
      }
    }
  }

  scanDir(QUIZ_DIR);
  return quizzes;
}

/**
 * Charge le catalogue index.json s'il existe, sinon le génère
 */
export function getQuizCatalog() {
  const indexPath = path.join(QUIZ_DIR, "index.json");

  if (fs.existsSync(indexPath)) {
    return JSON.parse(fs.readFileSync(indexPath, "utf-8"));
  }

  // Générer automatiquement
  const quizzes = listQuizzes();
  return {
    generated: new Date().toISOString(),
    quizzes,
  };
}
