import * as vscode from 'vscode';
import { MarkdownWysiwygEditorProvider } from './markdownEditor';
import { AiAssistantPanelProvider } from './aiAssistantPanel';
import { QuipClient } from './quipClient';
import { QuipTreeDataProvider, QuipTreeItem } from './quipTreeProvider';
import { QuipDocumentManager } from './quipDocumentManager';

export function activate(context: vscode.ExtensionContext) {
	// Register our custom markdown editor provider
	context.subscriptions.push(MarkdownWysiwygEditorProvider.register(context));

	// Register the AI Assistant panel provider
	const aiAssistantProvider = new AiAssistantPanelProvider(context);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			AiAssistantPanelProvider.viewType,
			aiAssistantProvider
		)
	);

	// Initialize Quip integration
	const quipClient = new QuipClient();
	const quipDocumentManager = new QuipDocumentManager(quipClient, context);
	const quipTreeDataProvider = new QuipTreeDataProvider(quipClient);

	// Register Quip tree view
	const treeView = vscode.window.createTreeView('quipDocuments', {
		treeDataProvider: quipTreeDataProvider,
		showCollapseAll: true,
	});
	context.subscriptions.push(treeView);

	// Register Quip commands
	context.subscriptions.push(
		vscode.commands.registerCommand('quip.refresh', () => {
			quipTreeDataProvider.refresh();
			vscode.window.showInformationMessage('Quip documents refreshed');
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('quip.openDocument', async (item: QuipTreeItem) => {
			if (item && item.type === 'document') {
				const label = typeof item.label === 'string' ? item.label : item.label?.label || 'Untitled';
				await quipDocumentManager.openQuipDocument(item.id, label);
			}
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('quip.pushChanges', async () => {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showWarningMessage('No active editor');
				return;
			}

			const documentUri = editor.document.uri;
			if (documentUri.scheme !== 'file' || !documentUri.fsPath.endsWith('.md')) {
				vscode.window.showWarningMessage('Active file is not a markdown file');
				return;
			}

			await quipDocumentManager.pushChangesToQuip(documentUri);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('quip.createDocument', async () => {
			await quipDocumentManager.createNewQuipDocument();
			quipTreeDataProvider.refresh();
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('quip.setAccessToken', async () => {
			const token = await vscode.window.showInputBox({
				prompt: 'Enter your Quip access token',
				placeHolder: 'Get your token from https://quip.com/dev/token',
				password: true,
				ignoreFocusOut: true,
			});

			if (token) {
				const config = vscode.workspace.getConfiguration('markdownWysiwyg.quip');
				await config.update('accessToken', token, vscode.ConfigurationTarget.Global);
				quipClient.updateAccessToken(token);
				vscode.window.showInformationMessage('Quip access token saved successfully');
				quipTreeDataProvider.refresh();
			}
		})
	);

	// Listen for configuration changes
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration(e => {
			if (e.affectsConfiguration('markdownWysiwyg.quip.accessToken')) {
				quipTreeDataProvider.refresh();
			}
		})
	);
}