const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Building Expo Web...');
execSync('npx expo export --platform web --max-workers 1', { stdio: 'inherit' });

console.log('Renaming node_modules to vendor to fix GitHub Pages...');
const distAssets = path.join(__dirname, 'dist', 'assets');
const nodeModulesPath = path.join(distAssets, 'node_modules');
const vendorPath = path.join(distAssets, 'vendor');

if (fs.existsSync(nodeModulesPath)) {
  fs.renameSync(nodeModulesPath, vendorPath);
}

console.log('Patching JS bundles...');
const jsDir = path.join(__dirname, 'dist', '_expo', 'static', 'js', 'web');
const files = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));

for (const file of files) {
  const filePath = path.join(jsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/assets\/node_modules/g, 'assets/vendor');
  fs.writeFileSync(filePath, content, 'utf8');
}

console.log('Deploying to gh-pages...');
execSync('npx gh-pages -d dist -t', { stdio: 'inherit' });

console.log('Deployment complete!');
