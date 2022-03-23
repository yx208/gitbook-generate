// ==UserScript==
// @name         极客时间文章保存
// @namespace    https://github.com/InmoJl
// @version      0.0.1
// @description  在极客时间专栏内容页面增加一个保存按钮，点击后将正文以markdown格式下载保存——参考自：LazyBug1E0CF
// @author       元弦
// @match        *://time.geekbang.org/column/article/*
// @grant        none
// @require      https://unpkg.com/ajax-hook@1.8.3/dist/ajaxhook.min.js
// @require      https://unpkg.com/showdown/dist/showdown.min.js
// @license      https://choosealicense.com/licenses/mit/#
// ==/UserScript==

(function() {

    'use strict';

    const FILE_TYPE = "application/md",
        articleRegex = /^https?:\/\/time\.geekbang\.org\/serv\/v\d\/article/,
        mdService = new showdown.Converter();

    let saveBtn = document.getElementById("save_btn"),
        articleLinks = [],
        mdContent = '',
        mdTitle = '',
        downloadCount = 0;

    // 等待五秒 dom 加载完成
    setTimeout(() => {

        genSaveBtn();
        articleLinks = [...document.querySelectorAll('[class^=ArticleItem_articleItem_]')];

        let index = articleLinks.findIndex(item => /ArticleItem_active_/.test(item.className));
        // 防止重新加载后，继续下载上一章
        if (index > 0) index++;
        index !== -1 && articleLinks.splice(0, index);

        if (articleLinks.length > 0) {
            startDownload();
        }

    }, 5000);

    async function startDownload() {
        for (const link of articleLinks) {
            link.click();

            await sleep(1000);

            saveBtn.click();
            downloadCount++;

            await sleep(1000);

            if (downloadCount >= 15) {
                document.location.reload();
            }

            await sleep();
        }
    }

    hookAjax({
        //拦截回调
        onreadystatechange(xhr) {
            if (xhr.readyState === 4 && articleRegex.test(xhr.responseURL)) {

                const resJson = JSON.parse(xhr.response).data,
                    title = resJson.article_title,
                    data = resJson.article_content,
                    audio = resJson.audio_download_url,
                    article_cover = resJson.article_cover,
                    author_name = "作者: " + resJson.author_name,
                    time = "",
                    time2 = "";

                const img = `<img src="${article_cover}" alt="cover"><p>`,
                    audioTag= `<audio><source src="${audio}" type="audio/mpeg"></audio>`;

                const parseSource = "<h1>" + title + "</h1>"  + "<p>" + author_name + "<\p>" + time + "<p>" + time2 + "<p>" + img + audioTag + data;
                const parseContent = mdService.makeMarkdown(parseSource);

                mdTitle = title;
                mdContent = parseContent;
            }
        }
    });

    const genSaveBtn = () => {
        if (!saveBtn) {
            saveBtn = document.createElement("div");
            saveBtn.id = "save_btn";
            saveBtn.textContent = "存";
            saveBtn.onclick = () => {
                createAndDownloadFile(mdTitle + ".md", mdContent);
            };
            setSaveBtnStyle(saveBtn);
            document.querySelector("#app").appendChild(saveBtn);
        }
    }

    const setSaveBtnStyle = (saveBtn) => {
        saveBtn.style.position = "fixed";
        saveBtn.style.bottom = "2em";
        saveBtn.style.right = "2em";
        saveBtn.style.borderRadius = "50%";
        saveBtn.style.backgroundColor = "#f6f7f9";
        saveBtn.style.height = "38px";
        saveBtn.style.width = "38px";
        saveBtn.style.textAlign = "center";
        saveBtn.style.lineHeight = "38px";
        saveBtn.style.border = "1px solid #f6f7f9";
        saveBtn.style.cursor = "pointer";
    }

    const createAndDownloadFile = (fileName, content) => {
        const aTag = document.createElement('a');
        const blob = new Blob([content], {type: FILE_TYPE});
        aTag.download = fileName;
        aTag.href = URL.createObjectURL(blob);
        aTag.click();
        URL.revokeObjectURL(blob);
    }

    function sleep(duration = 3000) {
        return new Promise(resolve => {
            setTimeout(() => resolve(), duration);
        });
    }

})();
