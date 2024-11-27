import {syncProcessCwd} from 'zx'
syncProcessCwd();

if (await $`git diff --exit-code && git diff --cached --exit-code && git push -n`.exitCode != 0)
    throw new Error("Uncommitted or unpushed changes");

// Run tests
console.log("Running tests...");
if (await $`npm run test`.exitCode != 0)
    throw new Error("Unit tests failed");

// Update version
await $`npm version patch --no-git-tag-version`

// Get the package version
let pkg = await $`cat package.json`.json();
console.log(`Package Version: ${pkg.version}`);

// Run rollup
await $`npm run rollup`

// Tag and commit both repos
await git_tag_and_commit();

console.log("Build Completed Successfully");

async function git_tag_and_commit()
{
    await $`git add .`
    await $`git commit -m "v${pkg.version}" --allow-empty`
    await $`git tag -f "v${pkg.version}"`
    await $`git push --quiet`
    await $`git push -f --tags --quiet`
}
