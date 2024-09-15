"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyTreeItem = exports.ZoteroProviderTree = void 0;
const vscode = __importStar(require("vscode"));
const axios_1 = __importDefault(require("axios"));
class ZoteroProviderTree {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    zoteroItems = [];
    constructor() {
        this.fetchZoteroItems();
    }
    async fetchZoteroItems() {
        try {
            const response = await axios_1.default.post('http://localhost:23119/better-bibtex/json-rpc', {
                jsonrpc: '2.0',
                method: 'item.search',
                params: [""]
            });
            this.zoteroItems = response.data.result
                .filter((item) => item.citekey)
                .map((item) => item);
            this._onDidChangeTreeData.fire();
        }
        catch (error) {
            vscode.window.showErrorMessage('Failed to fetch Zotero items.');
            console.error(error);
        }
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (element === undefined) {
            return Promise.resolve(this.zoteroItems.map(item => new MyTreeItem(item.title, vscode.TreeItemCollapsibleState.Collapsed, item)));
        }
        else {
            if (element.zoteroItem) {
                const details = Object.keys(element.zoteroItem).map(key => new MyTreeItem(`${key}: ${JSON.stringify(element.zoteroItem[key])}`, vscode.TreeItemCollapsibleState.None));
                return Promise.resolve(details);
            }
            else {
                return Promise.resolve([]);
            }
        }
    }
}
exports.ZoteroProviderTree = ZoteroProviderTree;
class MyTreeItem extends vscode.TreeItem {
    label;
    collapsibleState;
    zoteroItem;
    constructor(label, collapsibleState, zoteroItem) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.zoteroItem = zoteroItem;
    }
}
exports.MyTreeItem = MyTreeItem;
//# sourceMappingURL=zoteroPrimarySideBarTreeView%20copy.js.map