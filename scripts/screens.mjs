// Regenerates the README and landing-page screenshots in public/screens from
// the real app, signed in as the read-only demo account (light and dark).
// Needs DEMO_PASSWORD in .env. Builds first so the shots show current code,
// then builds again so the landing page bundles the new images.
//
//   npm run screens
import { spawnSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const run = (cmd, args, env = {}) => {
  const r = spawnSync(cmd, args, { stdio: "inherit", shell: true, env: { ...process.env, ...env } });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

// The "marketing" test writes straight into public/screens; SCREENS_DIR only switches the screens project on.
const scratch = mkdtempSync(path.join(tmpdir(), "leadflow-screens-"));
run("npx", ["next", "build"]);
run("npx", ["playwright", "test", "--project=screens", "-g", "marketing"], { SCREENS_DIR: scratch, SCREENS: "marketing" });
run("npx", ["next", "build"]);
console.log("Screenshots written to public/screens");
