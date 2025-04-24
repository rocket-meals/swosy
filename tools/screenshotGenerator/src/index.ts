import puppeteer, {Page as PuppeteerPage, Browser} from "puppeteer";
import { promises as fs } from "fs";
// reduce the size of the screenshot with sharp
import sharp from "sharp";

import yargs from "yargs";

// Define command-line arguments using yargs
const argv = yargs
    .option('repositoryOwner', {
        alias: 'o',
        description: 'The owner of the repository',
        type: 'string',
        demandOption: false,
    })
    .option('repositoryName', {
        alias: 'r',
        description: 'The name of the repository',
        type: 'string',
        demandOption: false,
    })
    .option('screenshotDir', {
        alias: 'd',
        description: 'The directory to save screenshots',
        type: 'string',
        demandOption: false,
    })
    // option to skip existing screenshots
    .option('skipExisting', {
        alias: 's',
        description: 'Skip existing screenshots',
        type: 'boolean',
        demandOption: false,
    })
    .help()
    .alias('help', 'h')
    .argv as any;

// Use either environment variables or command-line arguments
const repositoryOwner = argv.repositoryOwner || process.env.REPOSITORY_OWNER;
const repositoryName = argv.repositoryName || process.env.REPOSITORY_NAME;
const screenshotDir = argv.screenshotDir || process.env.SCREENSHOT_DIR;
const skipExisting = argv.skipExisting || process.env.SKIP_EXISTING;

// check if all required environment variables are set
if (!repositoryOwner || !repositoryName || !screenshotDir) {
    console.error('Please provide the required environment variables or command-line arguments:');
    console.error('ENV: REPOSITORY_OWNER, REPOSITORY_NAME, SCREENSHOT_DIR');
    console.error('CLI: --repositoryOwner, --repositoryName, --screenshotDir');
    if(!repositoryOwner) console.error('Missing: REPOSITORY_OWNER');
    if(!repositoryName) console.error('Missing: REPOSITORY_NAME');
    if(!screenshotDir) console.error('Missing: SCREENSHOT_DIR');
    process.exit(1);
}

const screenshotDirWithSlash = screenshotDir.endsWith('/') ? screenshotDir : screenshotDir + '/';

console.log(`Generating screenshots for ${repositoryOwner}/${repositoryName}`);

const screens = [
    "login",
    'foodoffers',
    "eating-habits",
    "account-balance",
    "campus",
    'housing',
    "news",
    "course-timetable",
    "settings",
    "price-group",
    "data-access",
    "support-FAQ",
    "licenseInformation",
    "management",
    "statistics",
    "labels",
]; // Add your screens here

const baseUrl = 'https://' + repositoryOwner + '.github.io/' + repositoryName + '/';

const urls = screens.map(screen =>
    baseUrl + screen + '?kioskMode=true&deviceMock=iphone'
);

type Device = {
    name: string;
    width: number;
    height: number;
    deviceScaleFactor: number;
    horizontal?: boolean;
};

const devices: Device[] = [
    { name: 'google-playstore-presentation', width: 1024, height: 500, deviceScaleFactor: 1, horizontal: false }, // Deine Vorstellungsgrafik muss eine PNG- oder JPEG-Datei mit einer Größe von maximal 15 MB und einer Auflösung von 1024 × 500 Pixeln sein
    { name: 'google-playstore-phone', width: 1080/3, height: 1920/3, deviceScaleFactor: 3, horizontal: false }, // Screenshots für Telefon * Screenshots müssen PNG- oder JPEG-Dateien mit einem Seitenverhältnis von 16:9 oder 9:16, einer Dateigröße von maximal 8 MB und einer Breite bzw. Höhe von 320–3.840 Pixeln sein.
//    { name: 'google-playstore-tablet-7', width: 1080/3, height: 1920/3, deviceScaleFactor: 3, horizontal: false }, // Screenshots für Telefon * Seitenverhältnis von 16:9 oder 9:16, einer Dateigröße von maximal 8 MB und einer Breite bzw. Höhe von 320–3.840 Pixeln sein.
    { name: 'google-playstore-tablet-10', width: 1080, height: 1920, deviceScaleFactor: 1, horizontal: true }, // Screenshots für 10"-Tablet * Screenshots müssen PNG- oder JPEG-Dateien mit einem Seitenverhältnis von 16:9 oder 9:16, einer Dateigröße von maximal 8 MB und einer Breite bzw. Höhe von 1080–7680 Pixeln sein.
    { name: 'iphone-6.7', width: 1290/3, height: 2796/3, deviceScaleFactor: 3, horizontal: false },
    { name: 'iphone-5.5', width: 414, height: 736, deviceScaleFactor: 3, horizontal: false },
    { name: 'ipad-13', width: 2064/2, height: 2752/2, deviceScaleFactor: 2, horizontal: true },
    { name: 'ipad-12.9', width: 2048/2, height: 2732/2, deviceScaleFactor: 2, horizontal: true },
];


async function createDirIfNotExists(dirOrFilePath: string) {
    const dirPath = dirOrFilePath.endsWith('/') ? dirOrFilePath : dirOrFilePath.substring(0, dirOrFilePath.lastIndexOf('/'));
    await fs.mkdir(dirPath, { recursive: true }).catch(console.error);
}

async function createScreenshotUncompressed(url: string, device: Device, fileName: string, darkMode: boolean, browser: Browser) {
    const page = await browser.newPage();

    const valuePrefersColorScheme = darkMode ? 'dark' : 'light';
    await page.emulateMediaFeatures([
        {name: 'prefers-color-scheme', value: valuePrefersColorScheme},
    ]);

    console.log(`Creating screenshot for ${url} with device ${device.name}`);

    const height = device.horizontal ? device.width : device.height;
    const width = device.horizontal ? device.height : device.width;
    await page.setViewport({
        width: width,
        height: height,
        deviceScaleFactor: device.deviceScaleFactor,
    });
    await page.goto(url);
    await page.waitForNetworkIdle();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Pause for 2 seconds to allow animations to finish and images to load
    await page.screenshot({ path: fileName });
    console.log(`Saved screenshot: ${fileName}`);

    page.close();
}

function getFileSafeNameFromUrl(url: string) {
    const urlWithoutBaseUrl = url.replace(baseUrl, ''); // has no https:// and no repositoryOwner.github.io/repositoryName
    // replace all special characters with _ like /, ?, :, etc.
    return urlWithoutBaseUrl.replace(/https?:\/\/|\/|\?/g, '_');
}

function getFileName(url: string, device: Device){
    const fileSafeUrl = getFileSafeNameFromUrl(url);
    const fileSafeDeviceName = device.name.replace('-', '_');
    return screenshotDirWithSlash+'/'+fileSafeDeviceName+"/"+fileSafeUrl+'.png';
}

async function compressScreenshotAndDeleteOld(fileName: string) {
    console.log(`Compressing file: ${fileName}`);
    const compressedFileName = fileName.replace('.png', '_compressed.png');

    try {
        // Compress the image without changing its dimensions
        await sharp(fileName)
            .png({
                compressionLevel: 9,
                palette: true,       // Use a palette to reduce colors, which can reduce file size
                quality: 90         // Quality for lossy formats like JPEG (not used here, but for reference)
            })  // For PNG files, 9 is the highest compression level => smallest file size
            .toFile(compressedFileName);

        // Delete the old file
        await fs.unlink(fileName);

        // Rename the compressed file to the original file name
        await fs.rename(compressedFileName, fileName);

        console.log(`File compressed and original deleted: ${compressedFileName}`);
    } catch (error) {
        console.error('Error compressing the image:', error);
    }
}

function printEstimatedTime(startDate: Date, currentScreenshot: number, totalAmountOfScreenshots: number) {
    const currentDate = new Date();
    const timePassed = (currentDate.getTime() - startDate.getTime()) / 1000; // in seconds
    const timePerScreenshot = timePassed / currentScreenshot;
    const remainingScreenshots = totalAmountOfScreenshots - currentScreenshot;
    const estimatedTime = timePerScreenshot * remainingScreenshots;
    // console log with HH:mm remaining and the date and time when the script will finish
    const remainingHours = Math.floor(estimatedTime / 3600);
    const remainingMinutes = Math.floor((estimatedTime % 3600) / 60);
    const finishDate = new Date(currentDate.getTime() + estimatedTime * 1000);
    console.log(`Estimated time remaining: ${remainingHours}h ${remainingMinutes}m - Finish: ${finishDate.toLocaleString()}`);
}

async function deleteAllScreenshots() {
    // delete folder with all screenshots
    try {
        console.log(`Deleted all screenshots in folder: ${screenshotDir}`);
        await fs.rm(screenshotDir, { recursive: true, force: true });
    } catch (error) {
        console.error('Error deleting screenshots:', error);
    }
}

async function doesFileExist(fileName: string) {
    try {
        await fs.access(fileName);
        return true;
    } catch (error) {
        return false;
    }
}

(async () => {
    let browser = await puppeteer.launch({
        args: ['--lang=de', '--no-sandbox', '--disable-setuid-sandbox'],  // Set the browser language to German
    });

    let totalAmountOfScreenshots = urls.length * devices.length;
    console.log(`Generating ${totalAmountOfScreenshots} screenshots - Urls: ${urls.length}, Devices: ${devices.length}`);

    await createDirIfNotExists(screenshotDir);
    if(!skipExisting){
        await deleteAllScreenshots();
    }
    await createDirIfNotExists(screenshotDir);

    let startDate = new Date()
    let currentScreenshot = 0;
    const listFailedScreenshotsUrls = [];

    for (const url of urls) {
        for (const device of devices) {
            currentScreenshot++;
            console.log(`Generating screenshot ${currentScreenshot} of ${totalAmountOfScreenshots}`);
            const fileName = getFileName(url, device);
            const darkMode = false;
            await createDirIfNotExists(fileName);
            if(skipExisting){
                const fileExists = await doesFileExist(fileName);
                if(fileExists){
                    console.log(`Skipping existing screenshot: ${fileName}`);
                    continue;
                }
            }
            try{
                await createScreenshotUncompressed(url, device, fileName, darkMode, browser);
                await compressScreenshotAndDeleteOld(fileName);
            } catch (error: any) {
                console.error(`Error creating screenshot for ${url} with device ${device.name}: ${error.message}`);
                listFailedScreenshotsUrls.push(url);
            }

            printEstimatedTime(startDate, currentScreenshot, totalAmountOfScreenshots);
            console.log("---")
        }
    }

    console.log(`Failed screenshots: ${listFailedScreenshotsUrls.length}`);
    for(const url of listFailedScreenshotsUrls){
        console.log("- please check: "+url);
    }

    await browser.close();
    console.log('All screenshots generated');
})();
