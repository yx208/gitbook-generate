const fs = require('fs');
const path = require('path');
const { randomInt } = require('crypto');
const cheerio = require('cheerio');

function replace_img_url(path) {
    let html = fs.readFileSync(path, { encoding: 'utf8' });
    const $ = cheerio.load(html);
    html = null;

    $('img').each(function() {
        const ele = $(this);
        /** @type {string} */
        const native_url = ele.data("savepage-src");
        $(this).attr('src', native_url);
    });

    fs.writeFileSync(path, $.html(), { encoding: 'utf8' });
}

function rename_subs(dir) {
    const files = fs.readdirSync(dir);
    return files.map((item) => {

        const [prefix, name] = item.split("丨");
        const index = parseInt(prefix);
        const isNumberPrefix = !isNaN(index);

        const new_name = `${isNumberPrefix ? index : randomInt(1000, 10 ** 8)}.html`;
        fs.renameSync(path.join(dir, item), path.join(dir, new_name));

        return {
            index: isNumberPrefix ? `第 ${index} 章` : prefix,
            title: name.replace('.html', '').trim(),
            path: 'contents/' + new_name
        }
    });
}

function each_handle(files) {
    const total = ` / ${files.length}`;
    files.forEach((item, index) => {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(`正在写入 ${index + total}：${item.title}`);
        replace_img_url(path.join(__dirname, item.path));
    });
    process.stdout.write('\n');
}

function write_summary(summary) {
    const summary_content = 'export default ' + JSON.stringify(summary);
    fs.writeFile('src/summary.js', summary_content, () => {});
}

const res = rename_subs(__dirname + "/contents");
each_handle(res);
write_summary(res);
