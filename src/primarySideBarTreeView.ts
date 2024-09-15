import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class BibtexProviderTree implements vscode.TreeDataProvider<MyTreeItem> {

    private _onDidChangeTreeData: vscode.EventEmitter<MyTreeItem | undefined | null | void> = new vscode.EventEmitter<MyTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<MyTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    getTreeItem(element: MyTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: MyTreeItem): Thenable<MyTreeItem[]> {
        if (element === undefined) {
            return this.getBibtexFiles();
        } else if (element.contextValue === 'bibFile') {
            return this.getCitationsFromBibFile(element.resourceUri!.fsPath);
        } else if (element.contextValue === 'citation') {
            return this.getAttributesFromCitation(element);
        } else {
            return Promise.resolve([]);
        }
    }

    getBibtexFiles(): Thenable<MyTreeItem[]> {
        const bibFiles: MyTreeItem[] = [];
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
        } else {
            return Promise.resolve([]);
        }
    }

    getCitationsFromBibFile(filePath: string): Thenable<MyTreeItem[]> {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }

                const citations: MyTreeItem[] = [];
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

    getAttributesFromCitation(citation: MyTreeItem): Thenable<MyTreeItem[]> {
        return new Promise((resolve) => {
            const attributes: MyTreeItem[] = [];
            const attributeRegex = /(\w+)\s*=\s*{([^}]+)}/g;
            let match;

            while ((match = attributeRegex.exec(citation.bibtexData!)) !== null) {
                const attributeName = match[1];
                const attributeValue = match[2];
                attributes.push(new MyTreeItem(`${attributeName}: ${attributeValue}`, vscode.TreeItemCollapsibleState.None, 'attribute'));
            }

            resolve(attributes);
        });
    }
}

export class MyTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly contextValue: string,
        public readonly resourceUri?: vscode.Uri,
        public readonly bibtexData?: string
    ) {
        super(label, collapsibleState);
        this.contextValue = contextValue;
        this.resourceUri = resourceUri;
        this.bibtexData = bibtexData;
    }
}
