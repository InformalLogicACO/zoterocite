import * as vscode from 'vscode';
import axios from 'axios';

export class ZoteroProviderTree implements vscode.TreeDataProvider<MyTreeItem> {

    private _onDidChangeTreeData: vscode.EventEmitter<MyTreeItem | undefined | null | void> = new vscode.EventEmitter<MyTreeItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<MyTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private zoteroItems: ZoteroItem[] = [];

    constructor() {
        this.fetchZoteroItems();
    }

    private async fetchZoteroItems() {
        try {
            const response = await axios.post('http://localhost:23119/better-bibtex/json-rpc', {
                jsonrpc: '2.0',
                method: 'item.search',
                params: [""]
            });
            this.zoteroItems = response.data.result
                .filter((item: any) => item.citekey) 
                .map((item: any) => item); 
            this._onDidChangeTreeData.fire();
        } catch (error) {
            vscode.window.showErrorMessage('Failed to fetch Zotero items.');
            console.error(error);
        }
    }

    getTreeItem(element: MyTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: MyTreeItem): Thenable<MyTreeItem[]> {
        if (element === undefined) {
            return Promise.resolve(this.zoteroItems.map(item => new MyTreeItem(item.title, vscode.TreeItemCollapsibleState.Collapsed, item)));
        } else {
            if (element.zoteroItem) {
                const details = Object.keys(element.zoteroItem).map(key => 
                    new MyTreeItem(`${key}: ${JSON.stringify((element.zoteroItem as any)[key])}`, vscode.TreeItemCollapsibleState.None)
                );
                return Promise.resolve(details);
            } else {
                return Promise.resolve([]);
            }
        }
    }
}

export class MyTreeItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly zoteroItem?: ZoteroItem
    ) {
        super(label, collapsibleState);
    }
}

interface ZoteroItem {
    [key: string]: any; 
}
