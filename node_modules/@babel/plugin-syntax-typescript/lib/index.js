import { declare } from '@babel/helper-plugin-utils';

const index = declare((api, opts) => {
  api.assertVersion("^7.0.0-0 || ^8.0.0");
  const {
    disallowAmbiguousJSXLike,
    dts
  } = opts;
  return {
    name: "syntax-typescript",
    manipulateOptions(opts, parserOpts) {
      parserOpts.plugins.push(["typescript", {
        disallowAmbiguousJSXLike,
        dts
      }]);
    }
  };
});

export { index as default };
//# sourceMappingURL=index.js.map
