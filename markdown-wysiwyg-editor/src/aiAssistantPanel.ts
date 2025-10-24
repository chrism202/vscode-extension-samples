import * as vscode from 'vscode';
import * as path from 'path';
import { getNonce } from './util';

export class AiAssistantPanelProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'markdownAiAssistant.sidePanel';

	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(async data => {
			switch (data.type) {
				case 'createUniversalInstruction':
					await this._createUniversalInstruction();
					break;
				case 'createRelevantContext':
					await this._createRelevantContext();
					break;
				case 'openFile':
					await this._openFile(data.filePath);
					break;
				case 'deleteFile':
					await this._deleteFile(data.filePath);
					break;
				case 'getFiles':
					await this._sendFiles();
					break;
			}
		});

		// Send initial file list
		this._sendFiles();
	}

	private async _createUniversalInstruction() {
		if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
			vscode.window.showErrorMessage('Please open a workspace folder first.');
			return;
		}

		const workspaceFolder = vscode.workspace.workspaceFolders[0].uri;
		const aiAssistantFolder = vscode.Uri.joinPath(workspaceFolder, '.ai-assistant');
		const universalInstructionsFolder = vscode.Uri.joinPath(aiAssistantFolder, 'universal-instructions');

		// Ensure folders exist
		await this._ensureFolderExists(universalInstructionsFolder);

		// Prompt for file name
		const fileName = await vscode.window.showInputBox({
			prompt: 'Enter a name for your universal instruction',
			placeHolder: 'e.g., writing-style, tone-preferences',
			validateInput: (value) => {
				if (!value) {
					return 'File name cannot be empty';
				}
				if (!/^[a-zA-Z0-9-_]+$/.test(value)) {
					return 'File name can only contain letters, numbers, hyphens, and underscores';
				}
				return null;
			}
		});

		if (!fileName) {
			return;
		}

		const fileUri = vscode.Uri.joinPath(universalInstructionsFolder, `${fileName}.md`);

		// Check if file already exists
		try {
			await vscode.workspace.fs.stat(fileUri);
			vscode.window.showErrorMessage(`A file with the name "${fileName}.md" already exists.`);
			return;
		} catch {
			// File doesn't exist, which is what we want
		}

		// Create the file with template content
		const templateContent = `# ${fileName}\n\nDescribe your writing preferences here.\n\nFor example:\n- Tone (formal, casual, technical, etc.)\n- Style (concise, detailed, etc.)\n- Language preferences\n- Common patterns you prefer\n`;

		await vscode.workspace.fs.writeFile(fileUri, Buffer.from(templateContent, 'utf8'));

		// Open the file in the editor
		const doc = await vscode.workspace.openTextDocument(fileUri);
		await vscode.window.showTextDocument(doc);

		// Refresh the file list
		await this._sendFiles();

		vscode.window.showInformationMessage(`Universal instruction "${fileName}.md" created successfully.`);
	}

	private async _createRelevantContext() {
		if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
			vscode.window.showErrorMessage('Please open a workspace folder first.');
			return;
		}

		const workspaceFolder = vscode.workspace.workspaceFolders[0].uri;
		const aiAssistantFolder = vscode.Uri.joinPath(workspaceFolder, '.ai-assistant');
		const relevantContextFolder = vscode.Uri.joinPath(aiAssistantFolder, 'relevant-context');

		// Ensure folders exist
		await this._ensureFolderExists(relevantContextFolder);

		// Prompt for file name
		const fileName = await vscode.window.showInputBox({
			prompt: 'Enter a name for your relevant context',
			placeHolder: 'e.g., reference-data, examples, research',
			validateInput: (value) => {
				if (!value) {
					return 'File name cannot be empty';
				}
				if (!/^[a-zA-Z0-9-_]+$/.test(value)) {
					return 'File name can only contain letters, numbers, hyphens, and underscores';
				}
				return null;
			}
		});

		if (!fileName) {
			return;
		}

		const fileUri = vscode.Uri.joinPath(relevantContextFolder, `${fileName}.md`);

		// Check if file already exists
		try {
			await vscode.workspace.fs.stat(fileUri);
			vscode.window.showErrorMessage(`A file with the name "${fileName}.md" already exists.`);
			return;
		} catch {
			// File doesn't exist, which is what we want
		}

		// Create the file with template content
		const templateContent = `# ${fileName}\n\nAdd relevant context, data, or examples here.\n\nThis content will be available to AI assistants to help with your writing.\n`;

		await vscode.workspace.fs.writeFile(fileUri, Buffer.from(templateContent, 'utf8'));

		// Open the file in the editor
		const doc = await vscode.workspace.openTextDocument(fileUri);
		await vscode.window.showTextDocument(doc);

		// Refresh the file list
		await this._sendFiles();

		vscode.window.showInformationMessage(`Relevant context "${fileName}.md" created successfully.`);
	}

	private async _ensureFolderExists(folderUri: vscode.Uri) {
		try {
			await vscode.workspace.fs.stat(folderUri);
		} catch {
			await vscode.workspace.fs.createDirectory(folderUri);
		}
	}

	private async _openFile(filePath: string) {
		try {
			const uri = vscode.Uri.file(filePath);
			const doc = await vscode.workspace.openTextDocument(uri);
			await vscode.window.showTextDocument(doc);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to open file: ${error}`);
		}
	}

	private async _deleteFile(filePath: string) {
		try {
			const uri = vscode.Uri.file(filePath);
			const fileName = path.basename(filePath);

			const answer = await vscode.window.showWarningMessage(
				`Are you sure you want to delete "${fileName}"?`,
				'Delete',
				'Cancel'
			);

			if (answer === 'Delete') {
				await vscode.workspace.fs.delete(uri);
				await this._sendFiles();
				vscode.window.showInformationMessage(`"${fileName}" deleted successfully.`);
			}
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to delete file: ${error}`);
		}
	}

	private async _sendFiles() {
		if (!this._view) {
			return;
		}

		if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
			this._view.webview.postMessage({
				type: 'updateFiles',
				universalInstructions: [],
				relevantContext: []
			});
			return;
		}

		const workspaceFolder = vscode.workspace.workspaceFolders[0].uri;
		const aiAssistantFolder = vscode.Uri.joinPath(workspaceFolder, '.ai-assistant');
		const universalInstructionsFolder = vscode.Uri.joinPath(aiAssistantFolder, 'universal-instructions');
		const relevantContextFolder = vscode.Uri.joinPath(aiAssistantFolder, 'relevant-context');

		const universalInstructions = await this._getFilesInFolder(universalInstructionsFolder);
		const relevantContext = await this._getFilesInFolder(relevantContextFolder);

		this._view.webview.postMessage({
			type: 'updateFiles',
			universalInstructions,
			relevantContext
		});
	}

	private async _getFilesInFolder(folderUri: vscode.Uri): Promise<Array<{ name: string; path: string }>> {
		try {
			const files = await vscode.workspace.fs.readDirectory(folderUri);
			return files
				.filter(([name, type]) => type === vscode.FileType.File && name.endsWith('.md'))
				.map(([name]) => ({
					name,
					path: vscode.Uri.joinPath(folderUri, name).fsPath
				}));
		} catch {
			return [];
		}
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'panel.js'));
		const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'panel.css'));
		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));

		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleUri}" rel="stylesheet">
				<title>AI Writing Assistant</title>
			</head>
			<body>
				<div class="container">
					<section class="section">
						<div class="section-header">
							<h2>Universal Instructions</h2>
							<button class="add-button" id="addUniversalInstruction" title="Create new universal instruction">+</button>
						</div>
						<p class="section-description">
							Define your writing preferences and style guidelines that AI assistants should follow.
						</p>
						<div id="universalInstructionsList" class="file-list">
							<p class="empty-state">No universal instructions yet. Click + to create one.</p>
						</div>
					</section>

					<section class="section">
						<div class="section-header">
							<h2>Relevant Context</h2>
							<button class="add-button" id="addRelevantContext" title="Create new relevant context">+</button>
						</div>
						<p class="section-description">
							Add reference materials, data, and examples that can inform your writing.
						</p>
						<div id="relevantContextList" class="file-list">
							<p class="empty-state">No relevant context yet. Click + to create one.</p>
						</div>
					</section>
				</div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}
