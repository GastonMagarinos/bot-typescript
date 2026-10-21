import { declare, declarePreset } from '@babel/helper-plugin-utils';
import transformTypeScript from '@babel/plugin-transform-typescript';
import transformModulesCommonJS from '@babel/plugin-transform-modules-commonjs';
import { OptionValidator } from '@babel/helper-validator-option';

const v = new OptionValidator("@babel/preset-typescript");
function normalizeOptions(options = {}) {
  const TopLevelOptions = {
    ignoreExtensions: "ignoreExtensions",
    allowNamespaces: "allowNamespaces",
    disallowAmbiguousJSXLike: "disallowAmbiguousJSXLike",
    jsxPragma: "jsxPragma",
    jsxPragmaFrag: "jsxPragmaFrag",
    onlyRemoveTypeImports: "onlyRemoveTypeImports",
    optimizeConstEnums: "optimizeConstEnums",
    rewriteImportExtensions: "rewriteImportExtensions"
  };
  v.invariant(!("allowDeclareFields" in options), "The .allowDeclareFields option has been removed and it's now always enabled. Please remove it from your config.");
  v.invariant(!("allExtensions" in options) && !("isTSX" in options), "The .allExtensions and .isTSX options have been removed.\n" + "If you want to disable JSX detection based on file extensions, " + "you can set the .ignoreExtensions option to true.\n" + "If you want to force JSX parsing, you can enable the " + "@babel/plugin-syntax-jsx plugin.");
  v.validateTopLevelOptions(options, TopLevelOptions);
  const allowNamespaces = v.validateBooleanOption(TopLevelOptions.allowNamespaces, options.allowNamespaces, true);
  const jsxPragma = v.validateStringOption(TopLevelOptions.jsxPragma, options.jsxPragma, "React");
  const onlyRemoveTypeImports = v.validateBooleanOption(TopLevelOptions.onlyRemoveTypeImports, options.onlyRemoveTypeImports, true);
  const jsxPragmaFrag = v.validateStringOption(TopLevelOptions.jsxPragmaFrag, options.jsxPragmaFrag, "React.Fragment");
  const ignoreExtensions = v.validateBooleanOption(TopLevelOptions.ignoreExtensions, options.ignoreExtensions, false);
  const disallowAmbiguousJSXLike = v.validateBooleanOption(TopLevelOptions.disallowAmbiguousJSXLike, options.disallowAmbiguousJSXLike, false);
  if (disallowAmbiguousJSXLike) {
    v.invariant(ignoreExtensions, "disallowAmbiguousJSXLike:true requires ignoreExtensions:true");
  }
  const optimizeConstEnums = v.validateBooleanOption(TopLevelOptions.optimizeConstEnums, options.optimizeConstEnums, false);
  const rewriteImportExtensions = v.validateBooleanOption(TopLevelOptions.rewriteImportExtensions, options.rewriteImportExtensions, false);
  const normalized = {
    ignoreExtensions,
    allowNamespaces,
    disallowAmbiguousJSXLike,
    jsxPragma,
    jsxPragmaFrag,
    onlyRemoveTypeImports,
    optimizeConstEnums,
    rewriteImportExtensions
  };
  return normalized;
}

const pluginRewriteTSImports = declare(function ({
  types: t,
  traverse
}) {
  function maybeReplace(source, path, state) {
    if (!source) return;
    if (t.isStringLiteral(source)) {
      if (/^\.\.?\//.test(source.value)) {
        source.value = source.value.replace(/\.(tsx)$|((?:\.d)?)((?:\.[^./]+)?)\.([cm]?)ts$/i, function (m, tsx, d, ext, cm) {
          return tsx ? ".js" : d && (!ext || !cm) ? m : d + ext + "." + cm.toLowerCase() + "js";
        });
      }
      return;
    }
    path.replaceWith(t.callExpression(state.addHelper("tsRewriteRelativeImportExtensions"), [source]));
  }
  return {
    name: "preset-typescript/plugin-rewrite-ts-imports",
    visitor: traverse.explode({
      "ImportDeclaration|ExportAllDeclaration|ExportNamedDeclaration"(path, state) {
        const node = path.node;
        const kind = t.isImportDeclaration(node) ? node.importKind : node.exportKind;
        if (kind === "value") {
          maybeReplace(node.source, path.get("source"), state);
        }
      },
      ImportExpression(path, state) {
        maybeReplace(path.node.source, path.get("source"), state);
      }
    })
  };
});

const index = declarePreset((api, opts) => {
  api.assertVersion("^7.0.0-0 || ^8.0.0");
  const {
    ignoreExtensions,
    allowNamespaces,
    disallowAmbiguousJSXLike,
    jsxPragma,
    jsxPragmaFrag,
    onlyRemoveTypeImports,
    optimizeConstEnums,
    rewriteImportExtensions
  } = normalizeOptions(opts);
  const pluginOptions = disallowAmbiguousJSXLike => ({
    allowNamespaces,
    disallowAmbiguousJSXLike,
    jsxPragma,
    jsxPragmaFrag,
    onlyRemoveTypeImports,
    optimizeConstEnums
  });
  const getPlugins = disallowAmbiguousJSXLike => {
    const tsPlugin = [transformTypeScript, pluginOptions(disallowAmbiguousJSXLike)];
    return [tsPlugin];
  };
  const disableExtensionDetect = ignoreExtensions;
  return {
    plugins: rewriteImportExtensions ? [pluginRewriteTSImports] : [],
    overrides: disableExtensionDetect ? [{
      plugins: getPlugins(disallowAmbiguousJSXLike)
    }] : [{
      test: filename => filename == null || filename.endsWith(".ts"),
      plugins: getPlugins(false)
    }, {
      test: filename => filename?.endsWith(".mts"),
      sourceType: "module",
      plugins: getPlugins(true)
    }, {
      test: filename => filename?.endsWith(".cts"),
      sourceType: "unambiguous",
      plugins: [[transformModulesCommonJS, {
        allowTopLevelThis: true
      }], [transformTypeScript, pluginOptions(true)]]
    }, {
      test: filename => filename?.endsWith(".tsx"),
      plugins: getPlugins(false)
    }]
  };
});

export { index as default };
//# sourceMappingURL=index.js.map
