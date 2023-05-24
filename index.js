#!/usr/bin/env node
const fs = require('fs');
require('dotenv').config()

const path = process.env.CONFIG_PATH
const urls = process.argv.slice(2)

if (urls.length!==0) {
  updateRulesAndAppendToLocal(urls)
} else {
  fetchRulesAndAppendToLocal()
}

async function fetchRules () {
  const { files } = await fetch(`https://api.github.com/gists/${process.env.GIST_ID}`)
    .then(res => res.json())
  return files['clashrules.yaml'].content
}

function appendRulesToLocal (rules) {
  fs.readFile(path, 'utf8', (err, data) => {
    if (err) throw err;

    let modifiedContent
    const contents = data.split('# custom');
    if (contents.length!==3) {
      const lines = data.split('\n');
      lines.splice(-2, 0, `# custom\n${rules}\n# custom`);
  
      modifiedContent = lines.join('\n');
    } else {
      modifiedContent = contents[0]+`# custom\n${rules}\n# custom`+contents[2]
    }
    fs.writeFile(path, modifiedContent, 'utf8', (err) => {
      if (err) throw err;
      console.log('Content added successfully!');
    });
  });
}

async function fetchRulesAndAppendToLocal () {
  const rules = await fetchRules()
  console.log(rules)
  appendRulesToLocal(rules)
}

async function updateRulesAndAppendToLocal (urls) {
  const rules = await fetchRules()
  const appendedRules = urls.map(url => `- DOMAIN-SUFFIX,${url},Proxy`).join('\n')
  const newRules = rules+'\n'+appendedRules
  console.log(newRules)
  await fetch(`https://api.github.com/gists/${process.env.GIST_ID}`, {
    method: 'PATCH',
    headers: {
      Authorization: `token ${process.env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: {
        'clashrules.yaml': {
          content: newRules
        },
      },
    }),
  })
  appendRulesToLocal(newRules)
}
