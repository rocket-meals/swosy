import puppeteer, {Page as PuppeteerPage} from "puppeteer";
import { promises as fs } from "fs";
// reduce the size of the screenshot with sharp
import sharp from "sharp";

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

type Device = {
    name: string;
    width: number;
    height: number;
    deviceScaleFactor: number;
};

const devices: Device[] = [
    { name: 'iphone-6.7', width: 428, height: 926, deviceScaleFactor: 3 },
    { name: 'iphone-5.5', width: 414, height: 736, deviceScaleFactor: 3 },
    { name: 'ipad-13', width: 2064/2, height: 2752/2, deviceScaleFactor: 2 },
    { name: 'ipad-12.9', width: 2048/2, height: 2732/2, deviceScaleFactor: 2 },
];

function createDirIfNotExists(dir: string) {
    fs.mkdir(dir, { recursive: true }).catch(console.error);
}

async function createScreenshotUncompressed(url: string, device: Device, fileName: string) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    console.log(`Creating screenshot for ${url} with device ${device.name}`);
    await page.setViewport({
        width: device.width,
        height: device.height,
        deviceScaleFactor: device.deviceScaleFactor,
    });
    await page.goto(url);
    await page.waitForNetworkIdle();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Pause for 1 second
    await page.screenshot({ path: fileName });
    console.log(`Saved screenshot: ${fileName}`);

    await browser.close();
}

function getFileSafeNameFromUrl(url: string) {
    const urlWithoutBaseUrl = url.replace(baseUrl, ''); // has no https:// and no repositoryOwner.github.io/repositoryName
    // replace all special characters with _ like /, ?, :, etc.
    return urlWithoutBaseUrl.replace(/https?:\/\/|\/|\?/g, '_');
}

function getFileName(url: string, device: Device){
    const fileSafeUrl = getFileSafeNameFromUrl(url);
    const fileSafeDeviceName = device.name.replace('-', '_');
    return screenshotDirWithSlash+fileSafeUrl+'_'+fileSafeDeviceName+'.png';
}

async function compressScreenshotAndDeleteOld(fileName: string) {
    console.log(`Compressing file: ${fileName}`);
    const compressedFileName = fileName.replace('.png', '_compressed.png');

    try {
        // Compress the image without changing its dimensions
        await sharp(fileName)
            .png({ compressionLevel: 6 })  // For PNG files, 9 is the highest compression level => smallest file size
            .toFile(compressedFileName);

        // Delete the old file
        await fs.unlink(fileName);

        console.log(`File compressed and original deleted: ${compressedFileName}`);
    } catch (error) {
        console.error('Error compressing the image:', error);
    }
}

(async () => {
    createDirIfNotExists(screenshotDir);
    for (const url of urls) {
        for (const device of devices) {
            const fileName = getFileName(url, device);
            await createScreenshotUncompressed(url, device, fileName);
            await compressScreenshotAndDeleteOld(fileName);
        }
    }
})();
