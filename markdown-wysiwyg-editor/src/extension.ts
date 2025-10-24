import * as vscode from 'vscode';
import { MarkdownWysiwygEditorProvider } from './markdownEditor';
import { AiAssistantPanelProvider } from './aiAssistantPanel';

export function activate(context: vscode.ExtensionContext) {
	// Register our custom markdown editor provider
	context.subscriptions.push(MarkdownWysiwygEditorProvider.register(context));

	// Register the AI assistant side panel
	const aiAssistantProvider = new AiAssistantPanelProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			AiAssistantPanelProvider.viewType,
			aiAssistantProvider
		)
	);
}
