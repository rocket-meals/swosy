module.exports = async function (config, customProcEnv) {
  // Customize the config before returning it.
  if(!config.optimization){
    config.optimization = {};
  }
  // Disable minification, because we have named routing
  config.optimization.minimize = false;
  let procEnv = customProcEnv || process.env;
  let BASE_PATH = procEnv.BASE_PATH;
  if(!!BASE_PATH){
    // Add publicPath to given BASE_PATH from docker-compose.yml
    config.output.publicPath = "/"+BASE_PATH;
  }
  return config;
}
