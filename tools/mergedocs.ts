import fs from 'fs/promises';
import path from 'path';

async function mergeMarkdownDocs(dir: string, outputFile: string) {
    const files = await fs.readdir(dir);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    let mergedContent = '';
    for (const file of mdFiles) {
        const content = await fs.readFile(path.join(dir, file), 'utf-8');
        mergedContent += `\n\n# ${file.replace('.md', '')}\n\n${content}`;
    }

    await fs.writeFile(outputFile, mergedContent);
    console.log(`✅ Merged ${mdFiles.length} files into ${outputFile}`);
}

mergeMarkdownDocs('./docs', 'ZenithFrameworkDocs.md').then(() => {
    console.log('Documentation merged successfully!');
}).catch((err) => {
    console.error('Error merging documentation:', err);
});
