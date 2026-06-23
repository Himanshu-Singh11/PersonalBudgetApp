const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');
const traverse = require('@babel/traverse').default;

function findBareText(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findBareText(fullPath);
    } else if (fullPath.endsWith('.js')) {
      const code = fs.readFileSync(fullPath, 'utf8');
      try {
        const ast = babel.parseSync(code, {
          presets: ['@babel/preset-react'],
          filename: fullPath,
        });
        
        traverse(ast, {
          JSXText(path) {
            const text = path.node.value.trim();
            if (text) {
              const parent = path.parent;
              if (parent.type === 'JSXElement') {
                const name = parent.openingElement.name.name;
                if (name !== 'Text' && name !== 'Animated.Text' && name !== 'CustomText' && !name.toLowerCase().includes('text')) {
                  console.log(`Bare text found in ${fullPath} at line ${path.node.loc.start.line}: "${text}" inside <${name}>`);
                }
              }
            }
          },
          JSXExpressionContainer(path) {
            const exp = path.node.expression;
            const checkLiteral = (node) => {
              if (node.type === 'StringLiteral' || node.type === 'TemplateLiteral') {
                const parent = path.parent;
                if (parent.type === 'JSXElement') {
                  const name = parent.openingElement.name.name;
                  if (name !== 'Text' && name !== 'Animated.Text' && !name.toLowerCase().includes('text')) {
                    console.log(`Bare string expression found in ${fullPath} at line ${path.node.loc.start.line} inside <${name}>`);
                  }
                }
              }
            };

            checkLiteral(exp);
            
            if (exp.type === 'LogicalExpression' && exp.operator === '&&') {
               checkLiteral(exp.right);
            }
            if (exp.type === 'ConditionalExpression') {
               checkLiteral(exp.consequent);
               checkLiteral(exp.alternate);
            }
          }
        });
      } catch (e) {
        // ignore parse errors
      }
    }
  }
}

findBareText(path.join(__dirname, 'src'));
