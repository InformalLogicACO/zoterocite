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
let allTitles = [];
let CiteKeyWord = "\\cite";
let BibKeyWord = "\\bibliography";
let bibtexFileToUse = null;
function activate(context) {
    const fetchTitles = async () => {
        try {
            const response = await axios_1.default.post('http://localhost:23119/better-bibtex/json-rpc', {
                jsonrpc: '2.0',
                method: 'item.search',
                params: [""]
            });
            allTitles = response.data.result.map((item) => ({
                title: item.title,
                citekey: item.citekey
            }));
        }
        catch (error) {
            vscode.window.showErrorMessage('Failed to fetch Zotero titles.');
            console.error(error);
        }
    };
    // Helper function to write or append to .bib file
    const writeToFile = async (filePath, content, citekey, append = false) => {
        const fileContent = await fs.promises.readFile(filePath, 'utf-8');
        if (fileContent.includes(citekey)) {
            vscode.window.showInformationMessage('Citation key already exists in the .bib file.');
            return true;
        }
        try {
            if (append) {
                await fs.promises.appendFile(filePath, '\n' + content);
            }
            else {
                await fs.promises.writeFile(filePath, '\n' + content);
            }
            return true;
        }
        catch (err) {
            vscode.window.showErrorMessage('Failed to write to the file.');
            console.error(err);
            return false;
        }
    };
    // Helper function to check if a file exists
    const fileExists = async (filePath) => {
        try {
            await fs.promises.access(filePath, fs.constants.F_OK);
            return true;
        }
        catch {
            return false;
        }
    };
    // Helper function to insert \bibliography line into the document
    const insertBibliographyLine = async (editor, document, bibtexFileName) => {
        const text = document.getText();
        const beginDocIndex = text.indexOf('\\begin{document}');
        if (beginDocIndex !== -1) {
            const position = document.positionAt(beginDocIndex + '\\begin{document}'.length);
            await editor.edit(editBuilder => {
                editBuilder.insert(position, `\n${BibKeyWord}{${bibtexFileName}}\n`);
            });
            return true;
        }
        else {
            vscode.window.showErrorMessage('Could not find \\begin{document} in the document.');
            return false;
        }
    };
    // Funktion zur Auswahl oder Erstellung einer .bib-Datei, die in allen Fällen genutzt wird
    const askUserForBibFilePreference = async () => {
        if (bibtexFileToUse) {
            // Wenn bereits eine .bib-Datei gesetzt ist, wird diese zurückgegeben
            return bibtexFileToUse;
        }
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            // Fehler, wenn kein Workspace geöffnet ist
            vscode.window.showErrorMessage('No workspace folder found.');
            return null;
        }
        const workspacePath = workspaceFolders[0].uri.fsPath;
        const bibFiles = await vscode.workspace.findFiles('**/*.bib'); // Suche nach bestehenden .bib-Dateien
        // Auswahlmenü für die vorhandenen .bib-Dateien oder das Erstellen einer neuen
        const bibFileOptions = bibFiles.map(file => path.relative(workspacePath, file.fsPath));
        bibFileOptions.push('Create new .bib file');
        const selectedBibFile = await vscode.window.showQuickPick(bibFileOptions, {
            placeHolder: 'Select a .bib file to add citations to or create a new one (press ESC to cancel):'
        });
        // Wenn der Benutzer "Neue .bib-Datei erstellen" auswählt
        if (selectedBibFile === 'Create new .bib file') {
            const newBibFileName = await vscode.window.showInputBox({
                prompt: 'Enter the name for the new .bib file',
                placeHolder: 'filename'
            });
            if (newBibFileName) {
                const newBibFilePath = path.join(workspacePath, `${newBibFileName}.bib`);
                bibtexFileToUse = newBibFilePath; // Neue .bib-Datei wird gesetzt
                return newBibFilePath;
            }
            else {
                vscode.window.showInformationMessage('No file name provided. Operation canceled.');
                return null;
            }
        }
        // Wenn der Benutzer eine vorhandene .bib-Datei ausgewählt hat
        if (selectedBibFile) {
            bibtexFileToUse = path.join(workspacePath, selectedBibFile);
            return bibtexFileToUse;
        }
        // Abbruch des Vorgangs, wenn keine Datei ausgewählt wurde
        vscode.window.showInformationMessage('No .bib file selected. Operation canceled.');
        return null;
    };
    // Funktion zur Überprüfung und Hinzufügung von Bibliographien sowie Einfügen von Zitaten
    const checkBibliographyAndFile = async (editor, bibtex, citekey) => {
        const document = editor.document;
        const text = document.getText();
        const regex = /\\bibliography{([^}]*)}/g; // Sucht nach Bibliographie-Einträgen
        const matches = [...text.matchAll(regex)]; // Alle gefundenen Bibliographien im Text
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder found.');
            return;
        }
        const workspacePath = workspaceFolders[0].uri.fsPath;
        // Fall 1: Keine Bibliographie gefunden
        if (matches.length === 0) {
            const addBibliography = await vscode.window.showQuickPick(['Add', 'Abort'], {
                placeHolder: 'No bibliography found in the document. Would you like to add it?'
            });
            if (addBibliography === 'Add') {
                const bibtexFileName = await askUserForBibFilePreference(); // Nutzung der Picker-Funktion für die Dateiauswahl
                if (bibtexFileName) {
                    const added = await insertBibliographyLine(editor, document, path.basename(bibtexFileName, '.bib'));
                    if (added) {
                        const fileCreated = await writeToFile(bibtexFileName, bibtex, citekey);
                        if (fileCreated) {
                            vscode.window.showInformationMessage(`File ${bibtexFileName} created and citation has been added.`);
                        }
                    }
                }
                else {
                }
            }
            else {
                vscode.window.showInformationMessage('Bibliography insertion canceled.');
            }
        }
        // Fall 2: Eine Bibliographie gefunden
        else if (matches.length === 1) {
            const bibtexFileName = matches[0][1];
            const filePath = path.join(workspacePath, `${bibtexFileName}.bib`);
            const bibFilePreference = await askUserForBibFilePreference(); // Nutzung der Picker-Funktion für die Dateiauswahl
            if (bibFilePreference) {
                const exists = await fileExists(filePath);
                if (!exists) {
                    const fileCreated = await writeToFile(filePath, bibtex, citekey);
                    if (fileCreated) {
                        vscode.window.showInformationMessage(`File ${bibtexFileName}.bib created and citation has been added.`);
                    }
                }
                else {
                    const appended = await writeToFile(filePath, bibtex, citekey, true);
                    if (appended) {
                        vscode.window.showInformationMessage(`Citation added to ${bibtexFileName}.bib.`);
                    }
                }
            }
            else {
                vscode.window.showInformationMessage('Citation insertion canceled.');
            }
        }
        // Fall 3: Mehrere Bibliographien gefunden
        else if (matches.length > 1) {
            const bibOptions = matches.map(match => match[1]);
            const selectedBib = await vscode.window.showQuickPick(bibOptions, {
                placeHolder: 'Multiple bibliographies found. Select the file to add citations to:'
            });
            if (selectedBib) {
                const filePath = path.join(workspacePath, `${selectedBib}.bib`);
                const bibFilePreference = await askUserForBibFilePreference(); // Nutzung der Picker-Funktion für die Dateiauswahl
                if (bibFilePreference) {
                    const exists = await fileExists(filePath);
                    if (!exists) {
                        const fileCreated = await writeToFile(filePath, bibtex, citekey);
                        if (fileCreated) {
                            vscode.window.showInformationMessage(`File ${selectedBib}.bib created and citation has been added.`);
                        }
                    }
                    else {
                        const appended = await writeToFile(filePath, bibtex, citekey, true);
                        if (appended) {
                            vscode.window.showInformationMessage(`Citation added to ${selectedBib}.bib.`);
                        }
                    }
                }
                else {
                    vscode.window.showInformationMessage('Citation insertion canceled.');
                }
            }
        }
    };
    const fetchBibTeX = async (citekey) => {
        try {
            const response = await axios_1.default.post('http://localhost:23119/better-bibtex/json-rpc', {
                jsonrpc: '2.0',
                method: 'item.export',
                params: [[citekey], 'bibtex']
            });
            return response.data.result;
        }
        catch (error) {
            vscode.window.showErrorMessage('Failed to fetch BibTeX data.');
            console.error(error);
            return '';
        }
    };
    const showCitationPickerCommand = vscode.commands.registerCommand('zoterocite.showCitationPicker', async () => {
        await fetchTitles();
        if (allTitles.length === 0) {
            vscode.window.showWarningMessage('No titles available. Please try again later.');
            return;
        }
        const input = await vscode.window.showQuickPick(allTitles.map(item => ({
            label: item.title,
            detail: `Cite key: ${item.citekey}`,
            citekey: item.citekey
        })), {
            placeHolder: 'Search Zotero citations...',
            matchOnDetail: true
        });
        if (input) {
            const editor = vscode.window.activeTextEditor;
            const bibtex = await fetchBibTeX(input.citekey);
            checkBibliographyAndFile(editor, bibtex, input.citekey);
            console.log(bibtex);
            if (editor) {
                editor.edit(editBuilder => {
                    editBuilder.insert(editor.selection.active, `${CiteKeyWord}{${input.citekey}}`);
                });
            }
        }
    });
    context.subscriptions.push(showCitationPickerCommand);
}
function deactivate() { }
//# sourceMappingURL=extensionw.js.map