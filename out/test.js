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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Globale Variablen für Bib-Dateien und Zotero-Titel
let bibFiles = [];
let zoteroItems = [];
// Aktivierungsfunktion des Plugins
function activate(context) {
    // Command zum Laden der Bib-Dateien und Zotero-Einträge
    const loadBibFiles = vscode.commands.registerCommand('extension.loadBibFiles', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders) {
            const workspacePath = workspaceFolders[0].uri.fsPath;
            const bibFileUris = await vscode.workspace.findFiles('**/*.bib');
            bibFiles = await Promise.all(bibFileUris.map(async (uri) => {
                const content = await fs.promises.readFile(uri.fsPath, 'utf-8');
                const citeKeys = extractCiteKeysFromBib(content);
                return {
                    label: path.basename(uri.fsPath),
                    filePath: uri.fsPath,
                    collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
                    citeKeys: citeKeys.map(key => ({
                        title: key,
                        citekey: key,
                        details: `Details for ${key}` // Details später ersetzen
                    }))
                };
            }));
            vscode.window.showInformationMessage('Bib files loaded successfully!');
        }
        else {
            vscode.window.showErrorMessage('No workspace folder found.');
        }
    });
    // TreeDataProvider für Bib-Dateien
    const bibFileTreeProvider = new class {
        getTreeItem(element) {
            return element;
        }
        getChildren(element) {
            if (!element) {
                // Root-Level: Zeigt die Bib-Dateien
                return bibFiles;
            }
            if (element.citeKeys) {
                // Zeigt die Cite-Keys, wenn auf die Bib-Datei geklickt wird
                return element.citeKeys.map(key => ({
                    label: key.title,
                    description: key.citekey,
                    details: key.details,
                    collapsibleState: vscode.TreeItemCollapsibleState.None,
                    filePath: element.filePath
                }));
            }
            return [];
        }
    };
    // TreeView für Bib-Dateien erstellen
    vscode.window.createTreeView('bibFileView', {
        treeDataProvider: bibFileTreeProvider,
        showCollapseAll: true
    });
    // TreeDataProvider für Zotero-Einträge
    const zoteroTreeProvider = new class {
        getTreeItem(element) {
            return {
                label: element.title,
                description: element.citekey,
                collapsibleState: vscode.TreeItemCollapsibleState.None,
                tooltip: element.details
            };
        }
        getChildren() {
            return zoteroItems;
        }
    };
    // TreeView für Zotero-Citationen erstellen
    vscode.window.createTreeView('zoteroCitationView', {
        treeDataProvider: zoteroTreeProvider,
        showCollapseAll: true
    });
    // Funktion zum Laden der Zotero-Titel
    const loadZoteroCitations = async () => {
        try {
            const response = await axios_1.default.post('http://localhost:23119/better-bibtex/json-rpc', {
                jsonrpc: '2.0',
                method: 'item.search',
                params: [""]
            });
            zoteroItems = response.data.result.map((item) => ({
                title: item.title,
                citekey: item.citekey,
                details: `Citation Key: ${item.citekey}`
            }));
            vscode.window.showInformationMessage('Zotero citations loaded successfully!');
        }
        catch (error) {
            vscode.window.showErrorMessage('Failed to fetch Zotero citations.');
            console.error(error);
        }
    };
    // Command zum Laden der Zotero-Einträge
    const loadZoteroCommand = vscode.commands.registerCommand('extension.loadZoteroCitations', loadZoteroCitations);
    // Settings-Bereich am unteren Rand der Sidebar
    vscode.workspace.onDidChangeConfiguration(() => {
        const config = vscode.workspace.getConfiguration('bibtexCitations');
        const citeKeyWord = config.get('citeKeyWord');
        const bibKeyWord = config.get('bibKeyWord');
        vscode.window.showInformationMessage(`Settings updated: Cite Key: ${citeKeyWord}, Bib Key: ${bibKeyWord}`);
    });
    // Settings in der `package.json` definieren
    vscode.commands.executeCommand('workbench.action.openSettings', 'bibtexCitations');
    // Registriere die Kommandos und Views
    context.subscriptions.push(loadBibFiles, loadZoteroCommand);
}
// Deaktivierung des Plugins
function deactivate() { }
// Funktion zum Extrahieren von Cite-Keys aus Bib-Dateien
function extractCiteKeysFromBib(bibContent) {
    const citeKeyRegex = /@.*?\{(.*?),/g;
    const citeKeys = [];
    let match;
    while ((match = citeKeyRegex.exec(bibContent)) !== null) {
        citeKeys.push(match[1]);
    }
    return citeKeys;
}
//# sourceMappingURL=test.js.map