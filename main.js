const fs = require("fs");
const path = require('path');

/**
 * @param {string} dir
 * @return {string[]}
 */
function get_files_from_dir(dir) {
    return fs.readdirSync(dir).filter(file => fs.statSync(path.join(dir, file)).isFile());
}

/**
 * @param {string} str
 */
function match_prefix_1(str) {
    return str.slice(0, -3).indexOf(" _ ");
}

/**
 * @param {string} str
 */
function match_prefix_2(str) {
    return str.slice(0, -3).indexOf("｜");
}

function is_number_prefix(str) {
    return !isNaN(parseInt(str));
}

function gen_break_point(file) {

    let index = match_prefix_1(file),
        no = '',
        real_name = '';

    if (index !== -1) {
        // 取出 01
        no = file.substring(0, index);
        // 取出 xxx
        real_name = file.substring(index + 3);
    } else {
        index = match_prefix_2(file);
        // 情况为 `30｜HTTP`
        if (index !== -1) {
            // 取出 30
            no = file.substring(0, index);
            // 取出 HTTP
            real_name = file.substring(index + 1);
        }
    }

    return { no, real_name };
}

/**
 * @param {string} op_dir
 * @return {{file_name: string, title: string, ctime: number}[]}
 */
function rename_articles(op_dir) {
    const files = get_files_from_dir(op_dir);
    return files.map(file => {

        clear_img_query(path.join(op_dir, file));

        const { no, real_name } = gen_break_point(file);

        const title = `${is_number_prefix(no) ? `第 ${no} 章` : no} ${real_name}`;
        const file_name = no + '.md';

        const origin_name = path.join(op_dir, file);
        const target_name = path.join(op_dir, file_name);
        fs.renameSync(origin_name, target_name);

        const ctime = fs.statSync(target_name).ctime.getTime();

        return { title, file_name, ctime };
    });
}

/**
 * @param {string} dir
 * @param {{file_name: string, title: string, ctime: number}[]} files
 */
function gen_toc(dir, files) {
    const summary = path.join(dir, 'SUMMARY.md');
    files.map(item => {
        const row_item = `* [${item.title}](articles/${item.file_name})\n`;
        fs.appendFileSync(summary, row_item);
    });
}

/**
 * 把开篇词放到最前面
 * @param {{file_name: string, title: string, ctime: number}[]} files
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
 * @param {{file_name: string, title: string, ctime: number}[]} files
 */
function sort_files(files) {
    files.sort((a, b) => a.ctime - b.ctime);
}

function check_can_work() {
    if (process.argv.length < 3) {
        console.log("你得让我知道在哪个目录工作！");
        process.exit();
    }
}

function parse_root_path() {
    const root_absolute_path = process.argv[2];

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
 * @return {string}
 */
function parse_article_path(root_path) {
    const article_absolute_path = path.join(root_path, 'articles');
    if (process.argv[3]) {

        const dir = path.resolve(root_path, process.argv[3]);

        if (!fs.existsSync(dir)) {
            console.log(`所选目标 [${dir}] 文件夹不存在！`);
            process.exit();
        }

        if (!fs.statSync(dir).isDirectory()) {
            console.log(`所选目标 [${dir}] 不是一个文件夹！`);
            process.exit();
        }

        return dir;
    }

    return article_absolute_path;
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

function main() {

    check_can_work();

    const root_absolute_path = parse_root_path();
    const article_absolute_path = parse_article_path(root_absolute_path);

    check_summary_file(root_absolute_path);

    const files = rename_articles(article_absolute_path);

    sort_files(files);
    extract_introduction(files);
    gen_toc(root_absolute_path, files);
}

main();
