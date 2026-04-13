import { runSecurityAudit } from "./agents/security-audit";
import { runTestCoverage } from "./agents/test-coverage";
import { runConventions } from "./agents/conventions";

function settled(result: PromiseSettledResult<string>, label: string): string {
  if (result.status === "fulfilled") return result.value;
  return `⚠️ Error en análisis (${label}): ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`;
}

export async function orchestrate(diff: string): Promise<string> {
  const [securityResult, testCoverageResult, conventionsResult] =
    await Promise.allSettled([
      runSecurityAudit(diff),
      runTestCoverage(diff),
      runConventions(diff),
    ]);

  return [
    "## 🤖 AI Code Review",
    "",
    "### 🔐 Security",
    settled(securityResult, "security-audit"),
    "",
    "### 🧪 Test Coverage",
    settled(testCoverageResult, "test-coverage"),
    "",
    "### 📐 Conventions",
    settled(conventionsResult, "conventions"),
  ].join("\n");
}
