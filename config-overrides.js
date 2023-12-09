import WebpackPluginReplaceNpm from "replace-module-webpack-plugin";
import webpack from "webpack";

const conf = {
  // The Webpack config to use when compiling your react app for development or production.
  webpack: (config, env) => {
    // ...add your webpack config
    config.resolve.fallback = {
      ...config.resolve.fallback,
      buffer: require.resolve("buffer/"),
      crypto: require.resolve("crypto-browserify"),
      assert: require.resolve("assert/"),
      stream: require.resolve("stream-browserify"),
      fs: false,
    };
    config.resolve.extensions = [...config.resolve.extensions, ".ts", ".js"];

    // config.externals = path.resolve(__dirname, "./node_modules/js/bsv.min.js");
    config.externals = {
      "bn.js": "BN",
    };

    config.module.noParse = /node_modules\/bn.js\/lib\/bn.js/;
    // config.externals = [
    //   function (ctx, callback) {
    //     // The external is a global variable called `nameOfGlobal`.
    //     callback(null, "bsv");
    //   },
    // ];
    config.plugins = [
      ...config.plugins,
      new webpack.ProvidePlugin({
        process: "process/browser",
        Buffer: ["buffer", "Buffer"],
      }),
      new WebpackPluginReplaceNpm({
        rules: [
          {
            originModule: "path",
            replaceModule: "path-browserify",
          },
          {
            originModule: "bsv-wasm",
            replaceModule: "bsv-wasm-web",
          },
        ],
      }),
    ];

    config.module.rules[1].oneOf.splice(2, 0, {
      test: /\.less$/i,
      exclude: [/\.module\.(less)$/, "/node_modules/bsv/"],
      use: [
        { loader: "style-loader" },
        { loader: "css-loader" },
        {
          loader: "less-loader",
          options: {
            lessOptions: {
              javascriptEnabled: true,
            },
          },
        },
      ],
    });
    return config;
  },
};

export default conf;
