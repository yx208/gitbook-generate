const {
    parse_root_path,
    parse_article_path,
    check_summary_file,
    rename_articles,
    sort_files,
    extract_introduction,
    gen_toc
} = require('./core.js');
const path = require("path");

async function main() {

    const root_absolute_path = await parse_root_path();
    const article_path = await parse_article_path(root_absolute_path);

    check_summary_file(root_absolute_path);

    const files = rename_articles(path.join(root_absolute_path, article_path));

    sort_files(files);
    extract_introduction(files);
    gen_toc(root_absolute_path, files);
}

main().catch(err => console.log(err));
