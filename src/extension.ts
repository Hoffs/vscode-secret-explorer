'use strict';

import * as vscode from 'vscode';

import { SecretProvider, Secret } from './secrets';
import { copyToClipboardAsB64, convertFromB64, convertFromB64Clipboard, convertFromText } from './commands';

export function activate(context: vscode.ExtensionContext) {
	const secretProvider = new SecretProvider(vscode.workspace.rootPath);
	vscode.window.registerTreeDataProvider('secretExplorer', secretProvider);
	vscode.commands.registerCommand('secretExplorer.createEntry', () => secretProvider.createSecret());
	vscode.commands.registerCommand('secretExplorer.refreshEntry', () => secretProvider.refresh());

	vscode.commands.registerCommand('secretExplorer.deleteEntry', (es: Secret) => secretProvider.deleteSecret(es));
	vscode.commands.registerCommand('secretExplorer.editEntry', (es: Secret) => es.openFile());
	vscode.commands.registerCommand('secretExplorer.entryToBase64', (es: Secret) => es.getBase64());
	
	vscode.commands.registerTextEditorCommand('extension.copyToClipboardAsBase64', (textEditor, textEditorEdit) => copyToClipboardAsB64(textEditor, textEditorEdit));
	vscode.commands.registerTextEditorCommand('extension.convertFromBase64ToTextFromClipboard', (textEditor, textEditorEdit) => convertFromB64Clipboard(textEditor, textEditorEdit));
	vscode.commands.registerTextEditorCommand('extension.convertFromBase64ToText', (textEditor, textEditorEdit) => convertFromB64(textEditor, textEditorEdit));
	vscode.commands.registerTextEditorCommand('extension.convertFromTextToBase64', (textEditor, textEditorEdit) => convertFromText(textEditor, textEditorEdit));
}