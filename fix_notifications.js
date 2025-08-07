const fs = require('fs');
const path = require('path');

const filePath = '/Users/shivaji/Desktop/PROJECTS/Prime SMS W/client/src/pages/CustomizeMessage.tsx';

let content = fs.readFileSync(filePath, 'utf8');

// Replace common toast patterns
content = content.replace(/toast\(\{\s*title:\s*"([^"]+)",\s*description:\s*"([^"]+)",\s*variant:\s*"destructive"\s*\}\);/g, 'notifier.error("$1: $2");');
content = content.replace(/toast\(\{\s*title:\s*"([^"]+)",\s*description:\s*"([^"]+)"\s*\}\);/g, 'notifier.success("$1: $2");');
content = content.replace(/toast\(\{\s*title:\s*"([^"]+)"\s*\}\);/g, 'notifier.info("$1");');

// Replace multiline toast patterns
content = content.replace(/toast\(\{\s*title:\s*"Connection error",[\s\S]*?\}\);/g, 'notifier.error("Connection error. Please check your connection and try again.");');

fs.writeFileSync(filePath, content);
console.log('Updated CustomizeMessage.tsx');