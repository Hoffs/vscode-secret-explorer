import * as vscode from 'vscode';
import * as clipboardy from 'clipboardy';

export function copyToClipboardAsB64(textEditor: vscode.TextEditor, textEditorEdit: vscode.TextEditorEdit)
{
	const text = textEditor.document.getText(new vscode.Range(textEditor.selection.start, textEditor.selection.end));
	var file = Buffer.from(text);
	const b64 = file.toString('base64');
	clipboardy.writeSync(b64);
	vscode.window.showInformationMessage(`Copied selected text to clipboard as Base64 string`);
}

export function convertFromB64Clipboard(textEditor: vscode.TextEditor, textEditorEdit: vscode.TextEditorEdit)
{
	const clipboardText = clipboardy.readSync();
	const b64 = Buffer.from(clipboardText, 'base64');
	const utf = b64.toString('utf-8');
	textEditorEdit.insert(textEditor.selection.start, utf);
}

export function convertFromB64(textEditor: vscode.TextEditor, textEditorEdit: vscode.TextEditorEdit)
{
	const range = new vscode.Range(textEditor.selection.start, textEditor.selection.end);
	const text = textEditor.document.getText(range);
	const source = Buffer.from(text, 'base64');
	const converted = source.toString('utf-8');
	textEditorEdit.replace(range, converted);
}

export function convertFromText(textEditor: vscode.TextEditor, textEditorEdit: vscode.TextEditorEdit)
{
	const range = new vscode.Range(textEditor.selection.start, textEditor.selection.end);
	const text = textEditor.document.getText(range);
	const source = Buffer.from(text, 'utf-8');
	const converted = source.toString('base64');
	textEditorEdit.replace(range, converted);
}