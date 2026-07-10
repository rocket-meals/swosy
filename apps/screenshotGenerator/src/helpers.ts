import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { Browser } from 'puppeteer';
import { Device } from './devices';
import { StringHelper } from 'repo-depkit-common';

// All screenshot output must stay inside the working tree: the repository root when the
// tool runs inside a checkout (found by walking up to the nearest .git), otherwise the
// current working directory.
function findAllowedBaseDir(): string {
  let current = process.cwd();
  while (true) {
    if (existsSync(path.join(current, '.git'))) return current;
    const parent = path.dirname(current);
    if (parent === current) return process.cwd();
    current = parent;
  }
}

const ALLOWED_BASE_DIR = findAllowedBaseDir();

// screenshotDir comes from a CLI flag / env var (SCREENSHOT_DIR). Canonicalize it and
// require it to stay inside the repository/current working directory, so a misconfigured
// value can never turn deleteAllScreenshots()'s recursive rm into a catastrophic delete.
function canonicalizeAndGuardDirPath(dirPath: string): string {
  const resolved = path.resolve(dirPath);
  if (resolved !== ALLOWED_BASE_DIR && !resolved.startsWith(ALLOWED_BASE_DIR + path.sep)) {
    throw new Error(`Refusing to operate on path outside "${ALLOWED_BASE_DIR}": "${resolved}"`);
  }
  const segments = resolved.split(path.sep).filter(Boolean);
  if (segments.length < 2) {
    throw new Error(`Refusing to operate on suspiciously shallow path: "${resolved}"`);
  }
  return resolved;
}

export async function createDirIfNotExists(dirOrFilePath: string) {
  const dirPath = dirOrFilePath.endsWith('/') ? dirOrFilePath : dirOrFilePath.substring(0, dirOrFilePath.lastIndexOf('/'));
  const safeDirPath = canonicalizeAndGuardDirPath(dirPath);
  await fs.mkdir(safeDirPath, { recursive: true }).catch(console.error);
}

export async function createScreenshotUncompressed(url: string, device: Device, fileName: string, darkMode: boolean, browser: Browser) {
  const page = await browser.newPage();
  const valuePrefersColorScheme = darkMode ? 'dark' : 'light';
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: valuePrefersColorScheme }]);
  console.log(`Creating screenshot for ${url} with device ${device.name}`);
  const height = device.horizontal ? device.width : device.height;
  const width = device.horizontal ? device.height : device.width;
  await page.setViewport({
    width,
    height,
    deviceScaleFactor: device.deviceScaleFactor,
  });
  await page.goto(url);
  await page.waitForNetworkIdle();
  await new Promise(resolve => setTimeout(resolve, 2000));
  // @ts-ignore
  await page.screenshot({ path: fileName });
  console.log(`Saved screenshot: ${fileName}`);
  page.close();
}

export function getFileSafeNameFromUrl(url: string, baseUrl: string) {
  const urlWithoutBaseUrl = url.replace(baseUrl, '');
  return StringHelper.replaceAllWithOptions({ str: urlWithoutBaseUrl, find: 'https?:\\/\\/|\\/|\\?', replace: '_' });
}

export function getFileName(url: string, device: Device, screenshotDirWithSlash: string, baseUrl: string) {
  const fileSafeUrl = getFileSafeNameFromUrl(url, baseUrl);
  const fileSafeDeviceName = StringHelper.replaceAllLiteralWithOptions({ str: device.name, find: '-', replace: '_' });
  return `${screenshotDirWithSlash}/${fileSafeDeviceName}/${fileSafeUrl}.png`;
}

export async function compressScreenshotAndDeleteOld(fileName: string) {
  console.log(`Compressing file: ${fileName}`);
  const compressedFileName = StringHelper.replaceAllLiteralWithOptions({ str: fileName, find: '.png', replace: '_compressed.png' });
  try {
    await sharp(fileName).png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(compressedFileName);
    await fs.unlink(fileName);
    await fs.rename(compressedFileName, fileName);
    console.log(`File compressed and original deleted: ${compressedFileName}`);
  } catch (error) {
    console.error('Error compressing the image:', error);
  }
}

export function printEstimatedTime(startDate: Date, currentScreenshot: number, totalAmountOfScreenshots: number) {
  const currentDate = new Date();
  const timePassed = (currentDate.getTime() - startDate.getTime()) / 1000;
  const timePerScreenshot = timePassed / currentScreenshot;
  const remainingScreenshots = totalAmountOfScreenshots - currentScreenshot;
  const estimatedTime = timePerScreenshot * remainingScreenshots;
  const remainingHours = Math.floor(estimatedTime / 3600);
  const remainingMinutes = Math.floor((estimatedTime % 3600) / 60);
  const finishDate = new Date(currentDate.getTime() + estimatedTime * 1000);
  console.log(`Estimated time remaining: ${remainingHours}h ${remainingMinutes}m - Finish: ${finishDate.toLocaleString()}`);
}

export async function deleteAllScreenshots(dir: string) {
  try {
    const safeDir = canonicalizeAndGuardDirPath(dir);
    console.log(`Deleted all screenshots in folder: ${safeDir}`);
    await fs.rm(safeDir, { recursive: true, force: true });
  } catch (error) {
    console.error('Error deleting screenshots:', error);
  }
}

export async function doesFileExist(fileName: string) {
  try {
    await fs.access(fileName);
    return true;
  } catch {
    return false;
  }
}
