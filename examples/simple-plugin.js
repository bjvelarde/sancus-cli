export const sancusPlugin = {
  name: 'no-console-log',
  files: ['**/*.js', '**/*.ts'],
  async detect(file) {
    const findings = [];
    const lines = file.content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('console.log(')) {
        findings.push({
          type: 'no-console-log',
          severity: 'low',
          location: `${file.path}:${i+1}`,
          lineRange: `${i+1}`,
          codeSnippet: lines[i].trim(),
          confidence: 'high',
          severityHint: 'low',
          message: 'Avoid using console.log in production',
          recommendation: 'Use a proper logger or remove',
          category: 'Best Practice',
        });
      }
    }
    return findings;
  }
};