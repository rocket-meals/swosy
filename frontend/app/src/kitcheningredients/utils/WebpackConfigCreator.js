module.exports = async function configureConfig(config, processEnv) {
  // Customize the config before returning it.
  console.log("Disable optimization");
  if(!config.optimization){
    config.optimization = {};
  }
  config.optimization.minimize = false;
  let procEnv = processEnv || process.env;
  let BASE_PATH = procEnv.BASE_PATH;
  if(!!BASE_PATH){
    config.output.publicPath = "/"+BASE_PATH;
  }
  return config;
}
