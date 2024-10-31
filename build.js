if (await $`git push -n`.exitCode != 0)
    throw new Error("Uncommitted or unpushed changes");

// Run tests
console.log("Running tests...");
if (await $`npm run test`.exitCode != 0)
    throw new Error("Unit tests failed");

// Update version
await $`npm version patch`

// Get the package version
let pkg = await $`cat package.json`.json();
console.log(`Package Version: ${pkg.version}`);

// Run rollup
await $`npm run rollup`

// Tag and commit both repos
await $`(cd ../dist/ && ${git_tag_and_commit()})`
await $`${git_tag_and_commit()}`

console.log("Build Completed Successfully");

async function git_tag_and_commit()
{
    return [
        `git add .`
        `git commit -m "${pkg.version}" --allow-empty`
        `git tag -f "${pkg.version}"`
        `git push --quiet`
        `git push -f --tags --quiet`
    ].join(" && ");
}
