import * as _babel_core from '@babel/core';
import { PluginPass } from '@babel/core';
import { Options as Options$1 } from '@babel/plugin-syntax-typescript';

interface Options extends Options$1 {
    /** @default true */
    allowNamespaces?: boolean;
    /** @default "React.createElement" */
    jsxPragma?: string;
    /** @default "React.Fragment" */
    jsxPragmaFrag?: string;
    onlyRemoveTypeImports?: boolean;
    optimizeConstEnums?: boolean;
}
declare const _default: (api: _babel_core.PluginAPI, options: Options, dirname: string) => _babel_core.PluginObject<object & PluginPass<object>>;

export { type Options, _default as default };
