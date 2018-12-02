import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as process from 'process';
import * as clipboardy from 'clipboardy';
import * as rimraf from 'rimraf';

export class SecretProvider implements vscode.TreeDataProvider<Secret> {
	private _winPath: string = `${process.env["APPDATA"]}\\Microsoft\\UserSecrets\\`;
	private _otherPath: string = "~/.microsoft/usersecrets/";
	private _secretPath = (os.platform() === "win32") ? this._winPath : this._otherPath;
	private _containsExtension: boolean = false;
	private _extensionsGlob = "**/*.{csproj,sln}";

	private _csprojWatcher: vscode.FileSystemWatcher;

	private _onDidChangeTreeData: vscode.EventEmitter<Secret | undefined> = new vscode.EventEmitter<Secret | undefined>();
	readonly onDidChangeTreeData: vscode.Event<Secret | undefined> = this._onDidChangeTreeData.event;

	constructor(private _workspaceRoot: string) {
		const pattern = new vscode.RelativePattern(_workspaceRoot, this._extensionsGlob);
		this._csprojWatcher = vscode.workspace.createFileSystemWatcher(pattern, false, false, false);

		this._csprojWatcher.onDidCreate(() => this.checkForFiles());
		this._csprojWatcher.onDidDelete(() => this.checkForFiles());
		this.checkForFiles();
	}

	private checkForFiles = (): void => {
		vscode.workspace.findFiles(this._extensionsGlob, "node_modules/**").then(this.handleFoundFiles);
	}

	private handleFoundFiles = (uris: vscode.Uri[]): void => {
		this.setStateAndRefresh(uris.length > 0);
	}

	private setStateAndRefresh = (state: boolean): void => {
		this._containsExtension = state;
		this.refresh();
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	createSecret(): void {
		vscode.window.showInputBox({ prompt: "Input UserSecretId/desired name", placeHolder: "User Secret Id" }).then((value) => {
			if (value === undefined || value.length === 0) {
				vscode.window.showInformationMessage("No secret created");
				return;
			}
			
			if (!this.pathExists(this._secretPath)) {
				fs.mkdirSync(this._secretPath);
			}
			
			const isdir = fs.readdirSync(this._secretPath).some(x => x === value);
			if (isdir)
			{
				const isfile = fs.readdirSync(path.join(this._secretPath, value)).some(x => x === "secrets.json");
				if (isfile) {
					vscode.window.showInformationMessage(`Secret with name ${value} already exists`);
					return;
				}
			} else {
				fs.mkdirSync(path.join(this._secretPath, value));
			}

			fs.writeFileSync(path.join(this._secretPath, value, "secrets.json"), "");
			vscode.window.showInformationMessage(`Secret with name ${value} created`);
			this.refresh();
		});
	}

	deleteSecret(element: Secret): void {
		const dir = element.fullPath.replace("secrets.json", "");
		rimraf.sync(dir);
		this.refresh();
	}

	getTreeItem(element: Secret): vscode.TreeItem {
		return element;
	}

	getChildren(element?: Secret): Thenable<Secret[]> {
		if (!this._containsExtension) {
			return Promise.resolve([]);
		} else {
			return Promise.resolve(this.getSecretFiles());
		}
	}

	private getSecretFiles(): Secret[] {
		if (this.pathExists(this._secretPath)) {
			const folders = fs.readdirSync(this._secretPath)
				.filter(found => fs.statSync(path.join(this._secretPath, found)).isDirectory());
			return folders.map<Secret>(folder => {
				const filePath = path.join(this._secretPath, folder, "secrets.json");
				if (!fs.statSync(filePath).isFile()) return null;
				return new Secret(filePath, folder, vscode.TreeItemCollapsibleState.None);
			});
		} else {
			return [];
		}
	}

	private pathExists(p: string): boolean {
		try {
			fs.accessSync(p);
		} catch (err) {
			return false;
		}

		return true;
	}
}

export class Secret extends vscode.TreeItem {
	constructor(
		public readonly fullPath: string,
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
	}

	get tooltip(): string {
		return `${this.label}`;
	}

	get description(): string {
		return `${this.label} secret`;
	}

	public openFile() {
		var openPath = vscode.Uri.file(this.fullPath);
		vscode.workspace.openTextDocument(openPath).then(doc => {
			vscode.window.showTextDocument(doc);
		});
	}

	public getBase64() {
		var file = fs.readFileSync(this.fullPath);
		const b64 = file.toString('base64');
		clipboardy.writeSync(b64);
		vscode.window.showInformationMessage(`Copied ${this.fullPath} contents to clipboard as Base64 string`);
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'logo.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'logo.svg')
	};

	contextValue = 'secret';
}
