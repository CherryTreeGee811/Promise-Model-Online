#!/usr/bin/env bash
set -euo pipefail

# Layer 2: Source code import boundary check.
# Uses TypeScript's built-in parser to find import declarations
# in all .ts files and verifies they're declared in 'dependencies'.

echo "=== Layer 2: Source Code Import Boundary Check ==="

# Run TypeScript-based analysis
node -e "
const ts = require('typescript');
const fs = require('fs');
const path = require('path');

// Read package.json for production dependencies
const pkg = require('./package.json');
const prodDeps = new Set(Object.keys(pkg.dependencies || {}));

const JS_DIR = 'PromiseModelOnline.Client/wwwroot/js';
const files = [];

// Find all .ts files
function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      walk(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
}
walk(JS_DIR);

let totalImports = 0;
const violations = [];

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);

  function visit(node, depth = 0) {
    if (depth > 50) return;

    // Detect import declarations
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier;
      if (moduleSpecifier && ts.isStringLiteral(moduleSpecifier)) {
        const pkgName = moduleSpecifier.text;
        totalImports++;
        // Skip relative imports
        if (pkgName.startsWith('.')) return;
        // Skip type-only imports
        // Check if this package is in production dependencies
        if (!prodDeps.has(pkgName)) {
          // Check for @scope/package
          let found = false;
          for (const dep of prodDeps) {
            if (pkgName === dep || pkgName.startsWith(dep + '/')) {
              found = true;
              break;
            }
          }
          if (!found) {
            violations.push({ file, pkg: pkgName });
          }
        }
      }
    }

    // Detect require() calls
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.Identifier && node.expression.text === 'require') {
      if (node.arguments.length > 0 && ts.isStringLiteral(node.arguments[0])) {
        const pkgName = node.arguments[0].text;
        totalImports++;
        if (!pkgName.startsWith('.') && !pkgName.startsWith('/')) {
          if (!prodDeps.has(pkgName)) {
            let found = false;
            for (const dep of prodDeps) {
              if (pkgName === dep || pkgName.startsWith(dep + '/')) {
                found = true;
                break;
              }
            }
            if (!found) {
              violations.push({ file, pkg: pkgName });
            }
          }
        }
      }
    }

    ts.forEachChild(node, child => visit(child, depth + 1));
  }

  visit(sourceFile);
}

console.log('  Scanned ' + files.length + ' file(s), ' + totalImports + ' import(s)');

if (violations.length > 0) {
  console.log('  ❌ Violation(s) found:');
  for (const v of violations) {
    const relPath = path.relative('PromiseModelOnline.Client/wwwroot/js', v.file);
    console.log('     ' + v.pkg + ' — imported in ' + relPath);
    console.log('     This package is not in \"dependencies\". Move it to \"dependencies\" or remove the import.');
  }
  process.exit(1);
} else {
  console.log('  ✅ All imports reference production dependencies');
}
" 2>&1

echo ""
echo "=== Summary ==="
