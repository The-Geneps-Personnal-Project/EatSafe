const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");

module.exports = {
    webpack: {
        configure: (config) => {
            config.resolve.plugins = config.resolve.plugins || [];
            config.resolve.plugins.push(
                new TsconfigPathsPlugin({
                    extensions: [".ts", ".tsx", ".js", ".jsx"]
                })
            );
            return config;
        }
    }
};
