// ==UserScript==
// @name         极客时间保存文章简介
// @namespace    https://github.com/purice93
// @version      0.0.1
// @description  在极客时间专栏内容页面增加一个保存按钮，点击后将正文以markdown格式下载保存
// @author       元弦
// @match        *://time.geekbang.org/column/intro/*
// @grant        none
// @require      https://unpkg.com/ajax-hook/dist/ajaxhook.min.js
// @require      https://unpkg.com/showdown/dist/showdown.min.js
// @license      https://choosealicense.com/licenses/mit/#
// ==/UserScript==

let file_title = 'README.md',
    file_content = '';

(() => {

    const MATCH_URL = "//time.geekbang.org/serv/v3/column/info";
    const markdown_parser = new showdown.Converter();

    let file_title = 'README.md',
        file_content = '';

    ah.proxy({
        onResponse(res, handler) {

            if (res.config.url === MATCH_URL) {
                entrance(JSON.parse(res.response).data);
            }

            handler.next(res);
        }
    });

    const entrance = async data => {

        const html_content = parser_html(data);
        file_content = markdown_parser.makeMarkdown(html_content);

        create_download_button();
    }

    const parser_html = (data) => {
        /** @type {ModuleItem[]} */
        const modules = data.extra.modules;
        const header = `<h1>${data.title}</h1><p>${data.subtitle}</p>`;
        const content = modules.map(item => `<h3>${item.title}</h3>${item.content}`).join('');

        return header + content;
    }

    const create_download_button = () => {
        const save_btn = document.createElement("div");
        save_btn.id = "save-btn";
        save_btn.textContent = "D";
        save_btn.style.position = "fixed";
        save_btn.style.bottom = "2em";
        save_btn.style.right = "2em";
        save_btn.style.borderRadius = "50%";
        save_btn.style.backgroundColor = "#1d62f5";
        save_btn.style.color = "#fff";
        save_btn.style.height = "38px";
        save_btn.style.width = "38px";
        save_btn.style.textAlign = "center";
        save_btn.style.lineHeight = "38px";
        save_btn.style.cursor = "pointer";
        save_btn.onclick = () => {
            download_article(file_title, file_content);
        }

        document.querySelector("#app").appendChild(save_btn);
    }

    const download_article = (name, content) => {
        const a_ele = document.createElement("a");
        const blob = new Blob([content], { type: 'application/md' });
        const obj_url = URL.createObjectURL(blob);
        a_ele.download = name;
        a_ele.href = obj_url;
        a_ele.click();
        URL.revokeObjectURL(obj_url);
    }

})();
