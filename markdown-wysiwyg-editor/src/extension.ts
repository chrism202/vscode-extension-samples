import * as vscode from 'vscode';
import { MarkdownWysiwygEditorProvider } from './markdownEditor';

export function activate(context: vscode.ExtensionContext) {
	// Register our custom markdown editor provider
	context.subscriptions.push(MarkdownWysiwygEditorProvider.register(context));
}
