const repo = "pinball-hall-of-fame";
const isProd = process.env.NODE_ENV === "production";

/** @type {import('next').NextConfig} */
module.exports = {
  trailingSlash: true,
  basePath: isProd ? `/${repo}` : "",
  assetPrefix: isProd ? `/${repo}` : "",
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.module.rules.push(
      {
        test: /\.(woff|woff2|ttf)$/,
        type: "asset/resource",
        generator: {
          filename: "static/fonts/[name][ext]",
        },
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|ico)$/,
        type: "asset/resource",
        generator: {
          filename: "static/imgs/[name][ext]",
        },
      }
    );
    return config;
  },
};
