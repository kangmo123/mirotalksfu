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

  function replaceHttp(tagName, attributeName, folder, public = undefined) {
    const scriptTags = $(`${tagName}[${attributeName}]`);
    scriptTags.each((index, element) => {
      const attributeValue = $(element).attr(attributeName);
      if (attributeValue.startsWith('https://')) {
        const localPath = path.join(__dirname, `${resultPath}/${folder}`, attributeValue.substring(8));
        const publicPath = path.join(__dirname, `${resultPath}`, `${public}`, `${folder}`, attributeValue.substring(8));
        const localDir = path.dirname(localPath);
    
        if (!fs.existsSync(localDir)) {
          fs.mkdirSync(localDir, { recursive: true });
        }
    
        $(element).attr(attributeName, '.' + path.relative('.', publicPath).substring(resultPath.length));
        request(attributeValue).pipe(fs.createWriteStream(localPath))
      }
    });
  }

  replaceHttp('script', 'src', 'js', 'views')
  replaceHttp('link', 'href', 'css', 'views')
  replaceHttp('meta', 'content', 'meta', 'views')
  replaceHttp('img', 'src', 'img', 'views')

  fs.writeFileSync(path.join(resultPath, file), $.html());
})
