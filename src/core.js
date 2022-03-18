const fs = require("fs");
const path = require('path');
const { Input } = require('enquirer');

/**
 * @param {string} dir
 * @return {string[]}
 */
function get_files_from_dir(dir) {
    return fs.readdirSync(dir).filter(file => fs.statSync(path.join(dir, file)).isFile());
}

function is_number_prefix(str) {
    return !isNaN(parseInt(str));
}

/**
 * @param {string} str
 * @return {Array}
 */
function split_name(str) {
    const s = [' _ ', '｜'];
    const index = s.findIndex(i => str.includes(i));

    return (index === -1) ? ['', str] : str.split(s[index]);
}

/**
 * @param {string} op_dir
 * @return {object[]}
 */
function rename_articles(op_dir) {
    const files = get_files_from_dir(op_dir);
    return files.map(file => {
        const [ no, real_name ] = split_name(file);
        const title = `${is_number_prefix(no) ? `第 ${no} 章` : no} ${real_name}`,
            name = no + '.md',
            origin_path = path.join(op_dir, file),
            target_path = path.join(op_dir, name),
            ctime = fs.statSync(origin_path).ctime.getTime();

        clear_img_query(origin_path);
        fs.renameSync(origin_path, target_path);

        return { title, name, ctime, path: target_path };
    });
}

/**
 * @param {string} dir
 * @param post_path
 * @param {object[]} files
 */
function gen_toc(dir, post_path, files) {
    const summary = path.join(dir, 'SUMMARY.md');
    files.map(item => {
        const row_item = `* [${item.title}](articles/${item.name})\n`;
        fs.appendFileSync(summary, row_item);
    });
}

/**
 * 把开篇词放到最前面
 * @param {object[]} files
 */
function extract_introduction(files) {
    const index = files.findIndex(file => file.title.startsWith("开篇词"));
    if (index !== -1) {
        const target = files.splice(index, 1)[0];
        files.unshift(target);
    }
}

/**
 * 有些图片后面有查询条件，需要清除它，不然报错
 * @param {string} file_path
 */
function clear_img_query(file_path) {
    const string = fs.readFileSync(file_path).toString("utf8");
    fs.writeFileSync(file_path, string.replaceAll(/\?wh=[0-9]+\*[0-9]+/g, ''));
}

/**
 * 对读取到的文件列表，根据创建时间进行排序
 * @param {object[]} files
 */
function sort_files(files) {
    files.sort((a, b) => a.ctime - b.ctime);
}

async function parse_root_path() {

    const prompt_root = new Input({
        message: '输入 gitbook 所在目录路径',
        initial: ''
    });

    const root_absolute_path = await prompt_root.run();

    if (!fs.existsSync(root_absolute_path)) {
        console.log(`根路径 [${root_absolute_path}] 文件夹不存在！`);
        process.exit();
    }

    if (!fs.statSync(root_absolute_path).isDirectory()) {
        console.log("老师没有教你目录路径的写法？");
        process.exit();
    }

    return root_absolute_path;
}

/**
 * @param {string} root_path
 * @return {Promise<string>}
 */
async function parse_article_path(root_path) {

    const prompt_article = new Input({
        message: '文章所在位置（相对于 gitbook 的文件夹）',
        initial: 'articles'
    });

    const article_path = await prompt_article.run()
    const article_absolute_path = path.join(root_path, article_path);

    if (!fs.existsSync(article_absolute_path)) {
        console.log(`所选目标 [${article_absolute_path}] 文件夹不存在！`);
        process.exit();
    }

    if (!fs.statSync(article_absolute_path).isDirectory()) {
        console.log(`所选目标 [${article_absolute_path}] 不是一个文件夹！`);
        process.exit();
    }

    return article_path;
}

/**
 * 每次运行，清空 summary 文件
 * @param {string} root_path
 * @return {string}
 */
function check_summary_file(root_path) {
    fs.writeFileSync(path.join(root_path, 'SUMMARY.md'), "# Summary\n");
    // if (!) {
    //     console.log("SUMMARY.md 文件都没，玩个锤子！");
    //     process.exit();
    // }
}

module.exports = {
    parse_root_path,
    parse_article_path,
    check_summary_file,
    rename_articles,
    sort_files,
    extract_introduction,
    gen_toc
}
