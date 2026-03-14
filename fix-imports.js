const fs = require('fs');
const path = require('path');

// 读取 bugs.txt
const bugsContent = fs.readFileSync('文档/bugs.txt', 'utf-8');

// 提取所有需要修复的文件和导入
const errors = [];
const lines = bugsContent.split('\n');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 匹配文件路径和行号
    const match = line.match(/^(.+):(\d+):(\d+) - error TS1484:/);
    if (match) {
        let filePath = match[1];
        const lineNum = parseInt(match[2]);

        // 添加 born_the_spire/ 前缀
        filePath = 'born_the_spire/' + filePath;

        // 读取下一行获取导入语句
        const importLine = lines[i + 2];
        if (importLine) {
            const importMatch = importLine.match(/import \{ (.+?) \} from/);
            if (importMatch) {
                const imports = importMatch[1].split(',').map(s => s.trim());
                errors.push({ filePath, lineNum, imports });
            }
        }
    }
}

console.log(`找到 ${errors.length} 个需要修复的文件`);

// 按文件分组
const fileGroups = {};
errors.forEach(error => {
    if (!fileGroups[error.filePath]) {
        fileGroups[error.filePath] = [];
    }
    fileGroups[error.filePath].push(error);
});

// 修复每个文件
let fixedCount = 0;
for (const [filePath, fileErrors] of Object.entries(fileGroups)) {
    try {
        let content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n');

        // 从后往前修复（避免行号变化）
        fileErrors.sort((a, b) => b.lineNum - a.lineNum);

        for (const error of fileErrors) {
            const lineIndex = error.lineNum - 1;
            const line = lines[lineIndex];

            // 将 import { X } 改为 import type { X }
            if (line.includes('import {') && !line.includes('import type')) {
                lines[lineIndex] = line.replace(/^(\s*)import \{/, '$1import type {');
                fixedCount++;
            }
        }

        // 写回文件
        fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
        console.log(`✓ 修复 ${filePath}`);
    } catch (err) {
        console.error(`✗ 修复失败 ${filePath}:`, err.message);
    }
}

console.log(`\n完成！共修复 ${fixedCount} 处导入`);
