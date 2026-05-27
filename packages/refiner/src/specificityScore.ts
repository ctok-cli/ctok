/**
 * Specificity score (0-100) - measures how well-formed a prompt is.
 *
 * Dimensions (max points in parens):
 *  +20  has explicit goal verb (imperative action word)
 *  +15  names concrete entities (files, functions, fields, types)
 *  +15  has measurable success criterion
 *  +15  has output format spec
 *  +10  lists constraints
 *  +10  names what NOT to do
 *  +15  references code paths instead of pasting large blocks
 */

/** +20: prompt starts with or contains an imperative action verb. */
const GOAL_VERB_RE =
  /\b(?:implement|add|remove|fix|refactor|rename|move|extract|inline|migrate|write|generate|create|build|optimize|debug|resolve|convert|replace|extend|update|delete|expose|wire|integrate|deploy|configure|scaffold|check|run|start|stop|restart|verify|test|validate|setup|install|uninstall|lint|format|document|review|audit|analyze|parse|render|serve|scan|port|polish|publish|release|enable|disable|toggle|cleanup|clean|prepare|ship|patch|merge|rebase|tag|bump|upgrade|downgrade|investigate|profile|measure|benchmark|stub|mock|prototype|harden|simplify|expand|trim|prune|export|import|attach|detach|connect|disconnect|mount|unmount|register|deregister|subscribe|unsubscribe|encode|decode|encrypt|decrypt|sign|hash|seed|backfill|reindex|drop|truncate|restore|snapshot|fork|clone|provision|teardown|annotate|describe|explain|summarise|summarize|translate|localise|localize)\b/i;

/** +15: names concrete identifiers - file paths, function/class names, field names. */
const CONCRETE_ENTITY_RE =
  /(?:`[^`]+`|src\/[\w/.]+|lib\/[\w/.]+|app\/[\w/.]+|\w+\.(?:ts|tsx|js|jsx|mjs|cjs|py|dart|kt|java|rs|go|swift|rb|php|cs|md|mdx|json|jsonc|yml|yaml|toml|html|htm|xml|css|scss|sass|less|env|sql|prisma|graphql|gql|proto|lock|mod|cfg|ini|gradle|sh|ps1|bat|cmd|tf|hcl|nix|svelte|vue|astro|c|cpp|h|hpp|m|mm|r|lua|ex|exs|erl|hs|ml|fs|fsx|clj|cljs|nim|zig|d|pas|f90|asm)\b|\b[A-Z][a-zA-Z]+(?:Service|Controller|Handler|Manager|Repository|Store|Hook|Context|Provider|Component|Model|Schema|Enum|Type|Interface|Dto|Entity|Util|Helper|Factory|Builder|Adapter|Decorator|Validator|Parser|Renderer|Reducer|Selector|Action|Middleware|Guard|Resolver|Mutation|Query|Subscription|Pipe|Filter|Directive|Plugin|Extension|Module|Page|Layout|Route|Endpoint|Worker|Job|Task|Queue|Event|Listener|Emitter|Observer)\b)/;

/** +15: measurable success criterion - "should", "must", "returns X", "passes X test". */
const SUCCESS_CRITERION_RE =
  /\b(?:should|must|so that|in order to|expect|assert|verify|confirm|guarantee|ensure|passes?\s+(?:all\s+)?tests?|returns?\s+\w+|outputs?\s+\w+|produces?\s+\w+)\b/i;

/** +15: output format is specified. */
const OUTPUT_FORMAT_RE =
  /\b(?:return only|respond (?:as|with|in)|output (?:only|as|in)|format[: ]|no (?:explanation|prose|markdown)|json only|diff only|numbered list|bullet(?:ed)? list|unified diff|as json|as markdown|as yaml|as csv|only the (?:diff|function|file|class|code|result|sql|script))\b/i;

const STRUCTURED_OUTPUT_RE = /^OUTPUT\s*:/im;

/** +10: has a constraints section or inline constraints. */
const CONSTRAINTS_RE =
  /(?:CONSTRAINTS?\s*:|^-\s+(?:no\s+|don'?t\s+|avoid\s+|must\s+not\s+|should\s+not\s+))/im;

/** +10: names something NOT to do. */
const DO_NOT_RE =
  /\b(?:don'?t|do\s+not|avoid|never|no\s+(?:need\s+to)?|must\s+not|should\s+not)\b/i;

/** +15: references a code path (file:line format) instead of pasting code. */
const CODE_REF_RE =
  /(?:see\s+`?[\w/.]+:\d+(?:-\d+)?`?|in\s+`?[\w/.]+(?::\d+)?`?|at\s+`?[\w/.]+(?::\d+)?`?|`[\w/.]+:\d+`)/i;

/** Penalty: very large code block suggests pasting instead of referencing. */
const LARGE_CODE_BLOCK_RE = /```[\s\S]{1200,}```/;

export interface ScoreBreakdown {
  goalVerb: number;
  concreteEntities: number;
  successCriterion: number;
  outputFormat: number;
  constraints: number;
  doNotInstructions: number;
  codeReferences: number;
  total: number;
}

export function scoreBreakdown(prompt: string): ScoreBreakdown {
  const goalVerb = GOAL_VERB_RE.test(prompt) ? 20 : 0;
  const concreteEntities = CONCRETE_ENTITY_RE.test(prompt) ? 15 : 0;
  const successCriterion = SUCCESS_CRITERION_RE.test(prompt) ? 15 : 0;
  const outputFormat =
    OUTPUT_FORMAT_RE.test(prompt) || STRUCTURED_OUTPUT_RE.test(prompt) ? 15 : 0;
  const constraints = CONSTRAINTS_RE.test(prompt) ? 10 : 0;
  const doNotInstructions = DO_NOT_RE.test(prompt) ? 10 : 0;

  // Code references get +15 if referenced; penalty if pasting large blocks without reference
  let codeReferences = 0;
  if (CODE_REF_RE.test(prompt)) {
    codeReferences = 15;
  } else if (LARGE_CODE_BLOCK_RE.test(prompt)) {
    codeReferences = -5; // large paste without reference
  }

  const total = Math.max(
    0,
    Math.min(
      100,
      goalVerb + concreteEntities + successCriterion + outputFormat + constraints + doNotInstructions + codeReferences,
    ),
  );

  return {
    goalVerb,
    concreteEntities,
    successCriterion,
    outputFormat,
    constraints,
    doNotInstructions,
    codeReferences,
    total,
  };
}

export function specificityScore(prompt: string): number {
  return scoreBreakdown(prompt).total;
}
