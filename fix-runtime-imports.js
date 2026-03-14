const fs = require('fs');

// 运行 npm run build 并捕获输出
const { execSync } = require('child_process');

console.log('正在运行 TypeScript 检查...');
let output;
try {
    execSync('npm run build', { cwd: 'born_the_spire', encoding: 'utf-8', stdio: 'pipe' });
} catch (err) {
    output = err.stdout + err.stderr;
}

// 提取 TS1361 错误（不能作为值使用）
const lines = output.split('\n');
const errors = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 匹配 TS1361 错误
    const match = line.match(/^(.+)\((\d+),(\d+)\): error TS1361: '(.+?)' cannot be used as a value/);
    if (match) {
        const filePath = 'born_the_spire/' + match[1];
        const lineNum = parseInt(match[2]);
        const name = match[4];
        errors.push({ filePath, lineNum, name });
    }
}

console.log(`找到 ${errors.length} 个需要修复的 TS1361 错误`);

// 按文件分组
const fileGroups = {};
errors.forEach(error => {
    if (!fileGroups[error.filePath]) {
        fileGroups[error.filePath] = new Set();
    }
    fileGroups[error.filePath].add(error.name);
});

// 修复每个文件
let fixedCount = 0;
for (const [filePath, names] of Object.entries(fileGroups)) {
    try {
        let content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        // 找到所有 import type 语句并修复
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // 检查是否是 import type 语句
            if (line.includes('import type {')) {
                // 提取导入的名称
                const match = line.match(/import type \{(.+?)\}/);
                if (match) {
                    const imports = match[1].split(',').map(s => s.trim());

                    // 分离需要运行时值的和纯类型的
                    const runtimeImports = [];
                    const typeImports = [];

                    for (const imp of imports) {
                        const name = imp.split(' as ')[0].trim();
                        if (names.has(name)) {
                            runtimeImports.push(imp);
                        } else {
                            typeImports.push(imp);
                        }
                    }

                    // 如果有需要运行时值的导入，拆分成两行
                    if (runtimeImports.length > 0 && typeImports.length > 0) {
                        const indent = line.match(/^(\s*)/)[1];
                        const fromPart = line.match(/from (.+)/)[0];
                        lines[i] = `${indent}import { ${runtimeImports.join(', ')} } ${fromPart}\n${indent}import type { ${typeImports.join(', ')} } ${fromPart}`;
                        fixedCount++;
                    } else if (runtimeImports.length > 0) {
                        // 全部需要运行时值，移除 type
                        lines[i] = line.replace('import type {', 'import {');
                        fixedCount++;
                    }
                }
            }
        }

        // 写回文件
        fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
        console.log(`✓ 修复 ${filePath} (${names.size} 个导入)`);
    } catch (err) {
        console.error(`✗ 修复失败 ${filePath}:`, err.message);
    }
}

console.log(`\n完成！共修复 ${fixedCount} 个文件`);
