const FileSystem = require('expo-file-system');
console.log('Main exports keys:', Object.keys(FileSystem));

try {
  const Legacy = require('expo-file-system/legacy');
  console.log('Legacy exports keys:', Object.keys(Legacy));
} catch (e) {
  console.log('Legacy import failed:', e.message);
}
