use serde::Deserialize;
use std::process::Command;
use zed_extension_api::{self as zed, Result, SlashCommand, SlashCommandOutput, SlashCommandOutputSection};

// JSON response shapes from `ctok --json`

#[derive(Debug, Deserialize)]
struct TokenRange {
    min: u64,
    expected: u64,
    max: u64,
}

#[derive(Debug, Deserialize)]
struct Estimate {
    input: TokenRange,
    output: TokenRange,
    confidence: Option<String>,
}

#[derive(Debug, Deserialize)]
struct UsdRange {
    min: f64,
    max: f64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CostBreakdown {
    input_usd: f64,
    output_usd: f64,
    total_usd: f64,
    total_usd_range: UsdRange,
}

#[derive(Debug, Deserialize)]
struct EffortRec {
    effort: String,
    reason: Option<String>,
}

#[derive(Debug, Deserialize)]
struct ModelRec {
    model: String,
    reason: Option<String>,
}

#[derive(Debug, Deserialize)]
struct Recommendation {
    effort: EffortRec,
    model: ModelRec,
}

#[derive(Debug, Deserialize)]
struct Suggestion {
    title: String,
    detail: Option<String>,
    severity: Option<String>,
}

#[derive(Debug, Deserialize)]
struct CheckResult {
    estimate: Estimate,
    cost: CostBreakdown,
    recommendation: Recommendation,
    suggestions: Option<Vec<Suggestion>>,
}

#[derive(Debug, Deserialize)]
struct RefinePass {
    name: String,
    saved: Option<i64>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RefineResult {
    refined: String,
    saved_tokens: i64,
    saved_pct: f64,
    passes: Option<Vec<RefinePass>>,
    specificity_score: Option<u32>,
    specificity_before: Option<u32>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExtInfo {
    files: u32,
    tokens: u64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct HeavyFile {
    path: String,
    tokens: u64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExcludedInfo {
    files: u32,
    tokens: u64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ScanResult {
    root: String,
    project_type: Option<String>,
    total_files: u32,
    estimated_tokens: u64,
    by_extension: Option<std::collections::HashMap<String, ExtInfo>>,
    top_heavy_files: Option<Vec<HeavyFile>>,
    excluded: Option<ExcludedInfo>,
}

// Formatting helpers

fn fmt_tokens(n: u64) -> String {
    if n >= 1_000_000 {
        format!("{:.1}M", n as f64 / 1_000_000.0)
    } else if n >= 1_000 {
        format!("{:.1}k", n as f64 / 1_000.0)
    } else {
        n.to_string()
    }
}

fn fmt_usd(v: f64) -> String {
    if v < 0.01 {
        format!("${:.4}", v)
    } else {
        format!("${:.2}", v)
    }
}

fn effort_label(effort: &str) -> &'static str {
    match effort {
        "low" => "🟢 Low",
        "medium" => "🟡 Medium",
        "high" => "🟠 High",
        "xhigh" => "🔴 X-High",
        _ => "⚪ Unknown",
    }
}

// CLI runner

/// Returns the path to the ctok executable, trying common install locations.
fn find_executable() -> Option<String> {
    let candidates = [
        "ctok",
        "/usr/local/bin/ctok",
        "/opt/homebrew/bin/ctok",
        // Windows npm global bin (node_modules/.bin)
        "ctok.cmd",
    ];
    for candidate in &candidates {
        // Quick existence check: try running with --version and discard output
        if Command::new(candidate).arg("--version").output().is_ok() {
            return Some(candidate.to_string());
        }
    }
    None
}

fn run_ctok(args: &[&str]) -> Result<String> {
    let exe = find_executable().ok_or_else(|| {
        "ctok not found. Install via: npm i -g @ctok/cli".to_string()
    })?;

    let output = Command::new(&exe)
        .args(args)
        .output()
        .map_err(|e| format!("Failed to run ctok: {e}"))?;

    if output.status.success() {
        String::from_utf8(output.stdout).map_err(|e| format!("ctok output is not UTF-8: {e}"))
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr).into_owned();
        Err(if stderr.is_empty() {
            "ctok exited with a non-zero status".to_string()
        } else {
            stderr
        })
    }
}

// Formatters

fn format_check(result: &CheckResult) -> String {
    let inp = &result.estimate.input;
    let out = &result.estimate.output;
    let cost = &result.cost;
    let rec = &result.recommendation;

    let mut s = String::new();
    s.push_str("## Token Estimate\n\n");
    s.push_str(&format!(
        "**Input:** {} tokens  (range {} - {})\n",
        fmt_tokens(inp.expected),
        fmt_tokens(inp.min),
        fmt_tokens(inp.max)
    ));
    s.push_str(&format!(
        "**Output:** {} tokens  (range {} - {})\n",
        fmt_tokens(out.expected),
        fmt_tokens(out.min),
        fmt_tokens(out.max)
    ));
    if let Some(conf) = &result.estimate.confidence {
        s.push_str(&format!("**Confidence:** {conf}\n"));
    }
    s.push('\n');

    s.push_str(&format!(
        "**Cost:** {}  (range {} - {})\n",
        fmt_usd(cost.total_usd),
        fmt_usd(cost.total_usd_range.min),
        fmt_usd(cost.total_usd_range.max)
    ));
    s.push_str(&format!(
        "  Input: {}  |  Output: {}\n\n",
        fmt_usd(cost.input_usd),
        fmt_usd(cost.output_usd)
    ));

    s.push_str(&format!(
        "**Effort:** {}\n",
        effort_label(&rec.effort.effort)
    ));
    if let Some(reason) = &rec.effort.reason {
        s.push_str(&format!("  *{reason}*\n"));
    }
    s.push_str(&format!("**Model:** {}\n", rec.model.model));
    if let Some(reason) = &rec.model.reason {
        s.push_str(&format!("  *{reason}*\n"));
    }

    if let Some(suggestions) = &result.suggestions {
        if !suggestions.is_empty() {
            s.push_str("\n### Suggestions\n\n");
            for sug in suggestions {
                let sev = sug.severity.as_deref().unwrap_or("info");
                s.push_str(&format!("- **[{sev}]** {}\n", sug.title));
                if let Some(detail) = &sug.detail {
                    if !detail.is_empty() {
                        s.push_str(&format!("  {detail}\n"));
                    }
                }
            }
        }
    }

    s
}

fn format_refine(result: &RefineResult) -> String {
    let mut s = String::new();
    s.push_str("## Refined Prompt\n\n");
    s.push_str(&format!(
        "**Saved:** {} tokens ({:.0}%)\n\n",
        result.saved_tokens, result.saved_pct
    ));

    if let (Some(before), Some(after)) = (result.specificity_before, result.specificity_score) {
        s.push_str(&format!(
            "**Specificity:** {before}/100 → {after}/100\n\n"
        ));
    }

    s.push_str("### Result\n\n");
    s.push_str(&result.refined);
    s.push_str("\n\n");

    if let Some(passes) = &result.passes {
        let meaningful: Vec<_> = passes
            .iter()
            .filter(|p| p.saved.unwrap_or(0) > 0)
            .collect();
        if !meaningful.is_empty() {
            s.push_str("### Passes Applied\n\n");
            for pass in meaningful {
                s.push_str(&format!(
                    "- **{}**: −{} tokens\n",
                    pass.name,
                    pass.saved.unwrap_or(0)
                ));
            }
        }
    }

    s
}

fn format_scan(result: &ScanResult) -> String {
    let mut s = String::new();
    s.push_str("## Project Scan\n\n");
    s.push_str(&format!("**Root:** {}\n", result.root));
    if let Some(pt) = &result.project_type {
        s.push_str(&format!("**Type:** {pt}\n"));
    }
    s.push_str(&format!(
        "**Files:** {}  |  **Estimated tokens:** {}\n\n",
        result.total_files,
        fmt_tokens(result.estimated_tokens)
    ));

    if let Some(by_ext) = &result.by_extension {
        if !by_ext.is_empty() {
            let mut exts: Vec<(&String, &ExtInfo)> = by_ext.iter().collect();
            exts.sort_by(|a, b| b.1.tokens.cmp(&a.1.tokens));

            s.push_str("### By Extension\n\n");
            s.push_str("| Extension | Files | Tokens |\n");
            s.push_str("|---|---|---|\n");
            for (ext, info) in exts.iter().take(10) {
                s.push_str(&format!(
                    "| `{}` | {} | {} |\n",
                    ext,
                    info.files,
                    fmt_tokens(info.tokens)
                ));
            }
            s.push('\n');
        }
    }

    if let Some(heavy) = &result.top_heavy_files {
        if !heavy.is_empty() {
            s.push_str("### Heaviest Files\n\n");
            for f in heavy.iter().take(8) {
                s.push_str(&format!("- `{}` - {}\n", f.path, fmt_tokens(f.tokens)));
            }
            s.push('\n');
        }
    }

    if let Some(excl) = &result.excluded {
        if excl.files > 0 {
            s.push_str(&format!(
                "**Excluded:** {} files  ({} tokens saved)\n",
                excl.files,
                fmt_tokens(excl.tokens)
            ));
        }
    }

    s
}

// Extension entry point

struct CtokExtension;

impl zed::Extension for CtokExtension {
    fn new() -> Self {
        CtokExtension
    }

    fn run_slash_command(
        &self,
        command: SlashCommand,
        args: Vec<String>,
        worktree: Option<&zed::Worktree>,
    ) -> Result<SlashCommandOutput> {
        match command.name.as_str() {
            "ctok-check" => self.cmd_check(&args),
            "ctok-refine" => self.cmd_refine(&args),
            "ctok-scan" => self.cmd_scan(worktree),
            other => Err(format!("Unknown command: {other}")),
        }
    }
}

impl CtokExtension {
    fn cmd_check(&self, args: &[String]) -> Result<SlashCommandOutput> {
        let prompt = args.join(" ");
        if prompt.trim().is_empty() {
            return Err(
                "Usage: /ctok-check <prompt text>\n\nExample: /ctok-check Refactor auth middleware"
                    .to_string(),
            );
        }

        let stdout = run_ctok(&["check", "--json", &prompt])?;
        let result: CheckResult = serde_json::from_str(&stdout)
            .map_err(|e| format!("Failed to parse ctok output: {e}"))?;

        let text = format_check(&result);
        Ok(SlashCommandOutput {
            sections: vec![SlashCommandOutputSection {
                range: 0..text.len(),
                label: "ctok check".to_string(),
            }],
            text,
        })
    }

    fn cmd_refine(&self, args: &[String]) -> Result<SlashCommandOutput> {
        let prompt = args.join(" ");
        if prompt.trim().is_empty() {
            return Err(
                "Usage: /ctok-refine <prompt text>\n\nExample: /ctok-refine Please help me handle the auth thing"
                    .to_string(),
            );
        }

        let stdout = run_ctok(&["refine", "--json", &prompt])?;
        let result: RefineResult = serde_json::from_str(&stdout)
            .map_err(|e| format!("Failed to parse ctok output: {e}"))?;

        let text = format_refine(&result);
        Ok(SlashCommandOutput {
            sections: vec![SlashCommandOutputSection {
                range: 0..text.len(),
                label: "ctok refine".to_string(),
            }],
            text,
        })
    }

    fn cmd_scan(&self, worktree: Option<&zed::Worktree>) -> Result<SlashCommandOutput> {
        let dir = worktree
            .map(|wt| wt.root_path())
            .unwrap_or_else(|| ".".to_string());

        let stdout = run_ctok(&["scan", "--json", &dir])?;
        let result: ScanResult = serde_json::from_str(&stdout)
            .map_err(|e| format!("Failed to parse ctok output: {e}"))?;

        let text = format_scan(&result);
        Ok(SlashCommandOutput {
            sections: vec![SlashCommandOutputSection {
                range: 0..text.len(),
                label: "ctok scan".to_string(),
            }],
            text,
        })
    }
}

zed::register_extension!(CtokExtension);
