import fs from "fs";
import path from "path";

type FrontMatterValue = string | string[];

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface FlashcardDeck {
  slug: string;
  title: string;
  wikiRef: string;
  tags: string[];
  difficulty: string;
  created: string;
  cards: Flashcard[];
}

const FLASHCARD_DIR = path.join(process.cwd(), "docs", "flashcards");
const FLASHCARD_EXTENSION = ".flashcard.md";

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

function stripLabel(value: string, labels: string[]): string {
  const labelPattern = labels.join("|");
  return value
    .replace(new RegExp(`^\\*\\*(?:${labelPattern})\\s*:?\\s*\\*\\*\\s*`, "i"), "")
    .replace(new RegExp(`^(?:${labelPattern})\\s*:\\s*`, "i"), "")
    .trim();
}

/**
 * Parse un bloc de carte.
 * Le premier titre `##` correspond au recto. Le verso commence après `>` ou
 * après un titre `### Verso`. Sans marqueur, le reste du bloc est le verso.
 */
function parseCard(block: string, id: string): Flashcard {
  const lines = block.split("\n");
  const front = stripLabel(
    (lines[0] ?? "").replace(/^##\s*/, ""),
    ["recto", "front", "question"]
  );

  const backLines: string[] = [];
  let inBack = false;

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      if (inBack) backLines.push("");
      continue;
    }

    if (/^#{2,4}\s*(verso|réponse|reponse|back|answer)\s*$/i.test(line)) {
      inBack = true;
      continue;
    }

    if (/^>/.test(line)) {
      inBack = true;
      backLines.push(line.replace(/^>\s?/, ""));
      continue;
    }

    if (/^-{3,}$/.test(line)) {
      inBack = true;
      continue;
    }

    // Une fois le verso commencé, tout le reste lui appartient.
    // Sinon, le bloc reste considéré comme du verso (format sans marqueur).
    inBack = true;
    backLines.push(line);
  }

  const back = stripLabel(backLines.join("\n").trim(), [
    "verso",
    "correction",
    "réponse",
    "reponse",
    "back",
    "answer",
  ]);

  return { id, front, back };
}

/**
 * Parse le contenu markdown d'un deck de flashcards
 */
export function parseFlashcardContent(
  content: string,
  slug: string
): FlashcardDeck {
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!fmMatch) {
    throw new Error(`Frontmatter manquant dans ${slug}`);
  }

  const meta = parseFrontmatter(fmMatch[1]);
  const body = fmMatch[2];

  // Le contenu peut être sous un titre "# Cartes" / "# Flashcards"
  const sectionMatch = body.match(
    /#\s*(?:cartes|flashcards?|flash\s*cards?)\n([\s\S]*?)$/i
  );
  const section = sectionMatch ? sectionMatch[1] : body;

  const blocks = section.split(/\n(?=##\s)/).filter((b) => b.trim());
  const cards = blocks
    .map((block, idx) => parseCard(block, `${slug}-card-${idx}`))
    .filter((card) => card.front.length > 0 && card.back.length > 0);

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
    cards,
  };
}

/**
 * Charge un deck depuis son slug
 */
export function loadFlashcardDeck(slug: string): FlashcardDeck {
  const filePath = path.join(FLASHCARD_DIR, `${slug}${FLASHCARD_EXTENSION}`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Deck de flashcards non trouvé: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, "utf-8");
  return parseFlashcardContent(content, slug);
}

/**
 * Liste tous les decks disponibles
 */
export function listFlashcardDecks(): Array<{
  slug: string;
  title: string;
  tags: string[];
  difficulty: string;
  wikiRef: string;
  cardCount: number;
}> {
  const decks: Array<{
    slug: string;
    title: string;
    tags: string[];
    difficulty: string;
    wikiRef: string;
    cardCount: number;
  }> = [];

  if (!fs.existsSync(FLASHCARD_DIR)) {
    return decks;
  }

  function scanDir(dir: string, prefix: string = "") {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativeSlug = prefix
        ? `${prefix}/${entry.name.replace(FLASHCARD_EXTENSION, "")}`
        : entry.name.replace(FLASHCARD_EXTENSION, "");

      if (entry.isDirectory()) {
        scanDir(fullPath, relativeSlug);
      } else if (entry.name.endsWith(FLASHCARD_EXTENSION)) {
        try {
          const content = fs.readFileSync(fullPath, "utf-8");
          const deck = parseFlashcardContent(content, relativeSlug);
          decks.push({
            slug: relativeSlug,
            title: deck.title,
            tags: deck.tags,
            difficulty: deck.difficulty,
            wikiRef: deck.wikiRef,
            cardCount: deck.cards.length,
          });
        } catch (e) {
          console.error(`Erreur parsing flashcards ${fullPath}:`, e);
        }
      }
    }
  }

  scanDir(FLASHCARD_DIR);
  return decks.sort((a, b) => a.title.localeCompare(b.title, "fr"));
}

/**
 * Charge le catalogue index.json s'il existe, sinon le génère
 */
export function getFlashcardCatalog() {
  const indexPath = path.join(FLASHCARD_DIR, "index.json");

  if (fs.existsSync(indexPath)) {
    return JSON.parse(fs.readFileSync(indexPath, "utf-8"));
  }

  // Générer automatiquement
  const decks = listFlashcardDecks();
  return {
    generated: new Date().toISOString(),
    decks,
  };
}
