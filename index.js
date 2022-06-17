const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());
const maxTitleLen = 100;
const maxDescLen = 5000;

class Youtube {
    browser = null;
    page = null;
    channelId = "";
    //setup puppteer
    async load(options) {
        try {
            this.browser = await puppeteer.launch({ headless: false });
            this.page = await this.browser.newPage();
            await this.page.setDefaultNavigationTimeout(0);
        } catch (err) {
            console.log(err);
        }
    }
    constructor(options) {}

    async changeLanguage() {
        try {
            const selectedLangSelector = '[aria-selected="true"]';
            await this.page.waitForSelector(selectedLangSelector);
            const selectedLang = await this.page.evaluate(
                (selectedLangSelector) =>
                document.querySelector(selectedLangSelector).innerText,
                selectedLangSelector
            );
            if (!selectedLang) {
                throw new Error("Failed to find selected language : Empty text");
            }
            if (selectedLang.includes("English")) {
                return;
            }
            await this.page.click(selectedLangSelector);
            await this.page.waitForTimeout(1000);
            const englishLangItemSelector =
                '[role="presentation"]:not([aria-hidden="true"])>[data-value="en-GB"]';
            await this.page.waitForSelector(englishLangItemSelector);
            await this.page.click(englishLangItemSelector);
            await this.page.waitForTimeout(1000);
        } catch (err) {
            console.log(err);
        }
    }

    async login(email, password) {
        try {
            await this.page.goto("https://studio.youtube.com/");
            const currentPageUrl = await this.page.url();

            await this.page.waitForTimeout(2000);
            if (!currentPageUrl.includes("https://accounts.google.com/")) return true;

            let emailSelector = 'input[type="email"]';
            let nextPageEmailSelector = "[id=identifierNext]";
            let passwordSelector = 'input[type="password"]:not([aria-hidden="true"])';
            let nextPagePasswordSelector = "[id=passwordNext]";

            await this.page.waitForTimeout(6000);
            await this.page.waitForSelector(emailSelector);
            await this.page.waitForTimeout(6000);
            await this.page.type(emailSelector, email, { delay: 150 });
            await this.page.keyboard.press("Enter");
            await this.page.waitForNavigation({ waitUntil: "networkidle2" });
            await this.page.waitForSelector(passwordSelector);
            await this.page.waitForTimeout(6000);
            await this.page.type(passwordSelector, password, { delay: 150 });

            await this.page.click(nextPagePasswordSelector);
            await this.page.keyboard.press("Enter");
            await this.page.waitForNavigation({ waitUntil: "networkidle2" });
            this.channelId = await this.page
                .url()
                .replace("https://studio.youtube.com/channel/", "");
            return true;
        } catch (err) {
            console.log(err);
            return err;
        }
    }
    async uploadVideo(video) {
        try {
            if (Array.isArray(video)) {
                for (let i = 0; i < video.length; i++) {
                    const res = await this.uploadVideo(video[i]);
                }
                // video.forEach(async(video) => {
                //     await this.uploadSingleVideo(video);
                // });
            } else if (typeof video === "object") {
                await this.uploadSingleVideo(video);
            } else {
                throw new Error("Invalid video type");
            }
        } catch (err) {
            console.log(err);
        }
        console.log("complerted");
    }
    async uploadSingleVideo(video) {
        // const new_page = await this.browser.newPage();
        const new_page = await this.page;

        await new_page.setDefaultNavigationTimeout(10000);
        // const selectBtnPath = "#select-files-button";
        const selectBtnPath = "input[name='Filedata']";

        const createBtn = "#create-icon";
        const createBtnUploadBtn = "#text-item-0";
        // const selectBtnPath = "#content > input[type=file]";
        const videoVisiblityTab = "#step-title-3";
        const publishBtn = "#done-button";
        // await new_page.goto("https://youtube.com/upload");
        // await new_page.goto("https://studio.youtube.com/");
        // await new_page.waitForNavigation({ waitUntil: "networkidle2" });
        // await new_page.waitForTimeout(5000);
        await new_page.waitForSelector(createBtn);
        await new_page.click(createBtn);
        await new_page.waitForSelector(createBtnUploadBtn);
        await new_page.click(createBtnUploadBtn);
        await new_page.waitForSelector(selectBtnPath);
        const uploadHandle = await new_page.$(selectBtnPath);
        await uploadHandle.uploadFile(video.path);
        await new_page.waitForFunction(
            "document.querySelectorAll('[id=\"textbox\"]').length > 1"
        );
        const textBoxes = await new_page.$x('//*[@id="textbox"]');
        // Add the title value
        await new_page.waitForTimeout(1000);
        await textBoxes[0].evaluate(
            (title) => (document.querySelectorAll("#textbox")[0].innerHTML = "")
        );
        await textBoxes[0].focus();
        await textBoxes[0].type(video.title.substring(0, maxTitleLen));
        // Add the Description content
        await textBoxes[1].evaluate(
            (desc) => (document.querySelectorAll("#textbox")[1].innerHTML = "")
        );
        await textBoxes[1].focus();
        await textBoxes[1].type(video.description.substring(0, maxDescLen));
        await new_page.waitForTimeout(3000);
        await new_page.waitForSelector(videoVisiblityTab);
        await new_page.click(videoVisiblityTab);
        // click on publish video option
        // here

        // and then publish the video
        await new_page.waitForSelector(publishBtn);
        await new_page.click(publishBtn);
        await new_page.waitForTimeout(16000);
        await new_page.waitForSelector("#close-button");
        await new_page.waitForTimeout(16000);
        // // *[@id="description"]
        // await new_page.click("#close-button");
        ////*[@id="close-button"]
        await new_page.evaluate(() => {
            document.querySelector("#close-button").click();
        });

        // close the page
        // await new_page.close();
        return true;
    }
    async uploadCommunityPost(post) {
        try {
            if (Array.isArray(post)) {
                // post.forEach(async(post) => {
                //     await this.uploadSingleCommunityPost(post);
                // });
                for (let i = 0; i < post.length; i++) {
                    const res = await this.uploadSingleCommunityPost(post[i]);
                }
            } else if (typeof post === "object") {
                await this.uploadSingleCommunityPost(post);
            } else {
                throw new Error("Invalid post type");
            }
        } catch (err) {
            console.log(err);
        }
    }
    async uploadSingleCommunityPost(post) {
        try {
            if (this.channelId === "") {
                throw new Error("Please login first before uploading a post");
                return;
            }

            if ("img" in post && "poll" in post) {
                throw new Error(
                    "You can only upload a post with an image or a poll!!!"
                );
                return;
            }
            // const new_page = await this.browser.newPage();
            const new_page = await this.page;
            await new_page.setDefaultNavigationTimeout(0);
            const communityTabURL = `https://www.youtube.com/channel/${this.channelId}/community?show_create_dialog=1`;
            if (!(await new_page.url().includes("/community"))) {
                await new_page.goto(communityTabURL);
                await new_page.waitForNavigation({ waitUntil: "networkidle2" });
            }
            await new_page.waitForTimeout(4000);
            const inputSelector = `div[id='contenteditable-root']`;
            await new_page.waitForSelector(`div[id='contenteditable-root']`);
            // await new_page.waitForNavigation();
            await new_page.waitForTimeout(4000);
            await new_page.waitForSelector(`#image-button`);
            const imgBtn = await new_page.$(`#image-button`);
            if (imgBtn) await imgBtn.click();
            await new_page.waitForTimeout(4000);
            if ("img" in post) {
                if (post.img.length > 0) {
                    await new_page.waitForTimeout(4000);
                    const postImg =
                        post.img.length >= 6 ? post.img.slice(0, 5) : post.img;
                    const postImages = await Promise.all(postImg);
                    await new_page.waitForSelector("#dropzone > input[type=file]");
                    const uploadHandle = await new_page.$("#dropzone > input[type=file]");
                    await uploadHandle.uploadFile(...postImages);
                } else {
                    throw new Error("You must provide at least one image.");
                }
            } else {
                await new_page.waitForSelector(
                    'button[aria-label="Cancel image post"]'
                );
                const imgClsBtn = await new_page.$(
                    'button[aria-label="Cancel image post"]'
                );
                await imgClsBtn.click();
            }
            if ("poll" in post) {
                if (post.poll.length > 0) {
                    await new_page.waitForTimeout(4000);
                    await new_page.evaluate(() => {
                        document
                            .querySelector(`#poll-button > ytd-button-renderer > a`)
                            .click();
                    });
                    if (post.poll.length > 2) {
                        // if (post.poll.length < 5) return
                        //
                        await new_page.waitForSelector(
                            `#add-option > ytd-button-renderer > a`
                        );
                        const addOptionBtn = await new_page.$(
                            `#add-option > ytd-button-renderer > a`
                        );
                        for (let i = 0; i < post.poll.length - 2; i++) {
                            await addOptionBtn.click();
                        }
                    }
                    for (let i = 0; i < post.poll.length; i++) {
                        const pollBox = await new_page.$(
                            `#poll-options > div:nth-child(${
                i + 1
              }) > tp-yt-paper-input  input`
                        );
                        await pollBox.focus();
                        await pollBox.type(post.poll[i], { delay: 150 });
                    }
                } else {
                    throw new Error("You must provide at least two options for a poll");
                }
            }
            await new_page.waitForTimeout(4000);
            const textBox = await new_page.$(`div[id='contenteditable-root']`);
            await textBox.focus();
            await textBox.type(post.title, { delay: 150 });
            await new_page.waitForTimeout(4000);

            await new_page.waitForSelector("#submit-button");
            const submitBtn = await new_page.$("#submit-button");
            await submitBtn.click();
            await new_page.waitForTimeout(4000);
            const element = await new_page.waitForSelector("#share-url"); // select the element
            const value = await element.evaluate((el) => el.innerText);
            console.log(value);
            // await new_page.waitForSelector("#share-url");
            // const share_url = await new_page.$("#share-url");
            await new_page.waitForSelector("#close-button");
            const closeFinalBtn = await new_page.$("#close-button");
            await closeFinalBtn.click();
            await new_page.waitForNavigation({ waitUntil: "networkidle2" });
            await new_page.waitForTimeout(6000);
            // await new_page.close();
        } catch (err) {
            console.log(err);
            return err;
        }
    }
}

// export youtube class
module.exports = Youtube;