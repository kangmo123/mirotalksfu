const fs = require('fs');
const path = require('path');
const request = require('request');
const cheerio = require('cheerio');

const sourcePath = 'public/views-bak'
const resultPath = 'public/views'

fs.rmSync(resultPath, {
  recursive: true,
  force: true,
})
fs.mkdirSync(resultPath, {
  recursive: true,
})

const files = fs.readdirSync(sourcePath).filter(item => item.endsWith('.html') || item.endsWith('.htm'))
files.forEach(file => {
  const htmlContent = fs.readFileSync(path.join(sourcePath, file), 'utf-8');
  const $ = cheerio.load(htmlContent);

  function replaceHttp(tagName, attributeName, folder) {
    const scriptTags = $(`${tagName}[${attributeName}]`);
    scriptTags.each((index, element) => {
      const attributeValue = $(element).attr(attributeName);
      if (attributeValue.startsWith('https://')) {
        const localPath = path.join(__dirname, `${resultPath}/${folder}`, attributeValue.substring(8));
        const localDir = path.dirname(localPath);
    
        if (!fs.existsSync(localDir)) {
          fs.mkdirSync(localDir, { recursive: true });
        }
    
        $(element).attr(attributeName, '.' + path.relative('.', localPath).substring(resultPath.length));
        request(attributeValue).pipe(fs.createWriteStream(localPath))
      }
    });
  }

  replaceHttp('script', 'src', 'js')
  replaceHttp('link', 'href', 'css')
  replaceHttp('meta', 'content', 'meta')
  replaceHttp('img', 'src', 'img')

  fs.writeFileSync(path.join(resultPath, file), $.html());
})
