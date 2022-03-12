const fs = require("fs");

/**
 * @param {string} path
 */
function get_files_from_dir(path) {
    return fs.readdirSync(path);
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
function rename_files(op_dir) {
    const files = get_files_from_dir(op_dir);
    return files.map(file => {

        const { no, real_name } = gen_break_point(file);

        const title = `${is_number_prefix(no) ? `第 ${no} 章` : no} ${real_name}`;
        const file_name = no + '.md';

        const origin_name = `${op_dir}/${file}`;
        const target_name = `${op_dir}/${file_name}`;
        fs.renameSync(origin_name, target_name);

        const ctime = fs.statSync(target_name).ctime.getTime();

        return { title, file_name, ctime };
    });
}

/**
 * @param {string} dir
 * @param {{file_name: string, title: string, ctime: number}[]} files
 */
function write_summary(dir, files) {
    const summary = `${dir}/SUMMARY.md`;
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
 * @param {string} file_path
 */
function clear_img_query(file_path) {
    const string = fs.readFileSync(file_path).toString("utf8");
    fs.writeFileSync(file_path, string.replaceAll(/\?wh=[0-9]+\*[0-9]+/g, ''));
}

/**
 * @param {string} baseURL
 * @param {{file_name: string, title: string, ctime: number}[]} files
 */
function each_handle_files(baseURL, files) {
    files.forEach(file => {
        clear_img_query(`${baseURL}/${file.file_name}`);
    });
}

/**
 * @param {{file_name: string, title: string, ctime: number}[]} files
 */
function sort_files(files) {
    files.sort((a, b) => a.ctime - b.ctime);
}

function main() {

    if (process.argv.length < 3) {
        console.log("你得让我知道在哪个目录工作！");
        process.exit();
    }

    const dir = process.argv[2];
    if (!fs.statSync(dir).isDirectory()) {
        console.log("老师没有教你目录路径的写法？");
        process.exit();
    }

    if (!fs.existsSync(`${dir}/SUMMARY.md`)) {
        console.log("SUMMARY.md 文件都没，玩个锤子！");
        process.exit();
    }

    const files = rename_files(dir + '/articles');


    sort_files(files);
    console.log(files);
    each_handle_files(dir + '/articles', files);
    extract_introduction(files);
    write_summary(dir, files);
}

main();
