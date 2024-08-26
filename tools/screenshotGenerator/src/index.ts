import puppeteer from "puppeteer";

const repositoryOwner = process.env.REPOSITORY_OWNER as string;
const repositoryName = process.env.REPOSITORY_NAME as string;
const screenshotDir = process.env.SCREENSHOT_DIR as string;

// check if all required environment variables are set
if (!repositoryOwner || !repositoryName || !screenshotDir) {
    console.error('Please provide the required environment variables: REPOSITORY_OWNER, REPOSITORY_NAME, SCREENSHOT_DIR');
    process.exit(1);
}

const screenshotDirWithSlash = screenshotDir.endsWith('/') ? screenshotDir : screenshotDir + '/';

console.log(`Generating screenshots for ${repositoryOwner}/${repositoryName}`);

const screens = [
    'housing',
    'foodoffers',
    'map',
    'accountbalance',
    'campus',
    'news',
    'course-timetable',
    'settings',
    'settings/eatinghabits',
    'settings/pricing',
    'data-access',
    'login'
]; // Add your screens here

const baseUrl = 'https://' + repositoryOwner + '.github.io/' + repositoryName + '/';

const urls = screens.map(screen =>
    baseUrl + screen + '?kiosk_mode=true&deviceMock=iphone'
);

const devices = [
    { name: 'iphone-6.7', width: 428, height: 926, deviceScaleFactor: 3 },
    { name: 'iphone-5.5', width: 414, height: 736, deviceScaleFactor: 3 },
    { name: 'ipad-13', width: 2064/2, height: 2752/2, deviceScaleFactor: 2 },
    { name: 'ipad-12.9', width: 2048/2, height: 2732/2, deviceScaleFactor: 2 },
];

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    for (const url of urls) {
        for (const device of devices) {
            await page.setViewport({
                width: device.width,
                height: device.height,
                deviceScaleFactor: device.deviceScaleFactor,
            });
            await page.goto(url)
            await page.waitForNetworkIdle();
            await new Promise(resolve => setTimeout(resolve, 1000)); // Pause for 5 seconds
            const urlWithoutBaseUrl = url.replace(baseUrl, ''); // has no https:// and no repositoryOwner.github.io/repositoryName
            // replace all special characters with _ like /, ?, :, etc.
            const fileSafeUrl = urlWithoutBaseUrl.replace(/https?:\/\/|\/|\?/g, '_');
            const fileSafeDeviceName = device.name.replace(/ /g, '_');

            const fileName = screenshotDirWithSlash+fileSafeUrl+'_'+fileSafeDeviceName+'.png';
            await page.screenshot({ path: fileName });
            console.log(`Saved screenshot: ${fileName}`);
        }
    }

    await browser.close();
})();
