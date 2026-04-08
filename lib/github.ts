const GITHUB_API = "https://api.github.com";

function authHeader() {
  return `Bearer ${process.env.GITHUB_TOKEN}`;
}

export async function getPRDiff(
  owner: string,
  repo: string,
  prNumber: number
): Promise<string> {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}`,
    {
      headers: {
        Authorization: authHeader(),
        Accept: "application/vnd.github.v3.diff",
      },
    }
  );

  if (!res.ok) {
    throw new Error(`GitHub getPRDiff failed: ${res.status} ${res.statusText}`);
  }

  return res.text();
}

export async function postComment(
  owner: string,
  repo: string,
  prNumber: number,
  body: string
): Promise<void> {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/issues/${prNumber}/comments`,
    {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ body }),
    }
  );

  if (!res.ok) {
    throw new Error(
      `GitHub postComment failed: ${res.status} ${res.statusText}`
    );
  }
}
