import type { PassResult, PassSuggestion } from "../types";

/**
 * Curated list of high-frequency typos. Intentionally short and conservative
 * so we never "correct" a deliberate misspelling, slang, or code identifier.
 * Each entry: [misspelling, correction].
 *
 * Sources: top entries from the wikipedia common-misspellings list and
 * AutoCorrect macros that ship with most word processors.
 */
const TYPOS: Array<[string, string]> = [
  ["teh", "the"],
  ["adn", "and"],
  ["nad", "and"],
  ["abotu", "about"],
  ["accomodate", "accommodate"],
  ["acheive", "achieve"],
  ["acheived", "achieved"],
  ["accross", "across"],
  ["adress", "address"],
  ["alot", "a lot"],
  ["alphabe", "alphabet"],
  ["ammend", "amend"],
  ["arguement", "argument"],
  ["aswell", "as well"],
  ["becuase", "because"],
  ["beleive", "believe"],
  ["beleif", "belief"],
  ["calender", "calendar"],
  ["catagory", "category"],
  ["cant", "can't"],
  ["collegue", "colleague"],
  ["coleage", "colleague"],
  ["comming", "coming"],
  ["commited", "committed"],
  ["concious", "conscious"],
  ["consistant", "consistent"],
  ["dont", "don't"],
  ["dependant", "dependent"],
  ["definately", "definitely"],
  ["dilemna", "dilemma"],
  ["embarass", "embarrass"],
  ["enviroment", "environment"],
  ["existance", "existence"],
  ["familar", "familiar"],
  ["fourty", "forty"],
  ["foward", "forward"],
  ["greatful", "grateful"],
  ["happend", "happened"],
  ["happenned", "happened"],
  ["hieght", "height"],
  ["heigth", "height"],
  ["independant", "independent"],
  ["inital", "initial"],
  ["lcoal", "local"],
  ["lenght", "length"],
  ["maintainence", "maintenance"],
  ["mispell", "misspell"],
  ["mispelled", "misspelled"],
  ["neccessary", "necessary"],
  ["necesary", "necessary"],
  ["noticable", "noticeable"],
  ["occured", "occurred"],
  ["occuring", "occurring"],
  ["occurence", "occurrence"],
  ["paralel", "parallel"],
  ["perserve", "preserve"],
  ["persistant", "persistent"],
  ["posession", "possession"],
  ["prefered", "preferred"],
  ["privilage", "privilege"],
  ["publically", "publicly"],
  ["recieve", "receive"],
  ["recieved", "received"],
  ["refered", "referred"],
  ["relevent", "relevant"],
  ["responsable", "responsible"],
  ["seperate", "separate"],
  ["sucess", "success"],
  ["succesful", "successful"],
  ["succesfully", "successfully"],
  ["thier", "their"],
  ["throught", "through"],
  ["tommorrow", "tomorrow"],
  ["truely", "truly"],
  ["untill", "until"],
  ["usefull", "useful"],
  ["wether", "whether"],
  ["wierd", "weird"],
  ["writeable", "writable"],
  ["youre", "you're"],
];

const TYPO_INDEX = new Map(TYPOS);
const TYPO_REGEX = new RegExp(`\\b(${TYPOS.map(([t]) => t).join("|")})\\b`, "gi");

function preserveCase(original: string, replacement: string): string {
  if (original === original.toUpperCase()) return replacement.toUpperCase();
  if (original[0] === original[0]?.toUpperCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

export function typoFix(prompt: string): PassResult {
  const suggestions: PassSuggestion[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;
  TYPO_REGEX.lastIndex = 0;

  while ((m = TYPO_REGEX.exec(prompt)) !== null) {
    const match = m[0];
    const key = match.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const fix = TYPO_INDEX.get(key);
    if (!fix) continue;
    const cased = preserveCase(match, fix);

    suggestions.push({
      label: `Fix typo: "${match}" -> "${cased}"`,
      original: match,
      replacement: cased,
      reason: "Common misspelling from a curated list. Replaced in place.",
      tokenDelta: 0,
    });
  }

  return {
    pass: "typoFix",
    name: "Typo correction",
    applied: suggestions.length > 0,
    suggestions,
    tokenDelta: 0,
  };
}

/** Apply: replace every known typo in-place, preserving original casing. */
export function applyTypoFix(prompt: string): string {
  return prompt.replace(TYPO_REGEX, (match) => {
    const fix = TYPO_INDEX.get(match.toLowerCase());
    return fix ? preserveCase(match, fix) : match;
  });
}
