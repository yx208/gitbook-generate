const path = require("path");
const {
    input_root_path,
    input_article_path,
    rename_articles,
    sort_files,
    gen_toc,
    clear_img_query
} = require('./core.js');

async function main() {

    const root_absolute_path = await input_root_path();
    const article_path = await input_article_path(root_absolute_path);
    const article_absolute_path = path.join(root_absolute_path, article_path);
    const files = rename_articles(article_absolute_path);

    clear_img_query(files);
    sort_files(files);
    gen_toc(root_absolute_path, article_path, files);

    console.log("生成成功 Done.");
}

main().catch(err => console.log(err));
