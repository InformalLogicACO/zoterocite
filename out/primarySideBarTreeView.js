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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyTreeItem = exports.BibtexProviderTree = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
class BibtexProviderTree {
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (element === undefined) {
            return this.getBibtexFiles();
        }
        else if (element.contextValue === 'bibFile') {
            return this.getCitationsFromBibFile(element.resourceUri.fsPath);
        }
        else if (element.contextValue === 'citation') {
            return this.getAttributesFromCitation(element);
        }
        else {
            return Promise.resolve([]);
        }
    }
    getBibtexFiles() {
        const bibFiles = [];
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders) {
            const folderUri = workspaceFolders[0].uri;
            const pattern = new vscode.RelativePattern(folderUri, '**/*.bib');
            return vscode.workspace.findFiles(pattern).then(files => {
                files.forEach(file => {
                    bibFiles.push(new MyTreeItem(file.fsPath, vscode.TreeItemCollapsibleState.Collapsed, 'bibFile', vscode.Uri.file(file.fsPath)));
                });
                return bibFiles;
            });
        }
        else {
            return Promise.resolve([]);
        }
    }
    getCitationsFromBibFile(filePath) {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                const citations = [];
                const citationRegex = /@.*{([^,]+),/g;
                let match;
                while ((match = citationRegex.exec(data)) !== null) {
                    const citationTitle = match[1];
                    citations.push(new MyTreeItem(citationTitle, vscode.TreeItemCollapsibleState.Collapsed, 'citation', undefined, data));
                }
                resolve(citations);
            });
        });
    }
    getAttributesFromCitation(citation) {
        return new Promise((resolve) => {
            const attributes = [];
            const attributeRegex = /(\w+)\s*=\s*{([^}]+)}/g;
            let match;
            while ((match = attributeRegex.exec(citation.bibtexData)) !== null) {
                const attributeName = match[1];
                const attributeValue = match[2];
                attributes.push(new MyTreeItem(`${attributeName}: ${attributeValue}`, vscode.TreeItemCollapsibleState.None, 'attribute'));
            }
            resolve(attributes);
        });
    }
}
exports.BibtexProviderTree = BibtexProviderTree;
class MyTreeItem extends vscode.TreeItem {
    label;
    collapsibleState;
    contextValue;
    resourceUri;
    bibtexData;
    constructor(label, collapsibleState, contextValue, resourceUri, bibtexData) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.contextValue = contextValue;
        this.resourceUri = resourceUri;
        this.bibtexData = bibtexData;
        this.contextValue = contextValue;
        this.resourceUri = resourceUri;
        this.bibtexData = bibtexData;
    }
}
exports.MyTreeItem = MyTreeItem;
//# sourceMappingURL=primarySideBarTreeView.js.map