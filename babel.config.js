module.exports = {
    env: {
        test: {
            presets: [
                ["@babel/preset-env", { modules: "commonjs" }],
            ]
        },
        production: {
            presets: [
                ["@babel/preset-env", { modules: false }],
            ]
        },
        development: {
            presets: [
                ["@babel/preset-env", { modules: false }],
            ]
        }
    }
};