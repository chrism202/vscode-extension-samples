import * as vscode from 'vscode';
import * as path from 'path';
import { getNonce } from './util';

interface ResourceFile {
	name: string;
	path: string;
	type: 'universal-instruction' | 'context';
}

/**
 * Provider for the AI Assistant side panel.
 * Manages Universal Instructions and Relevant Context files.
 */
export class AiAssistantPanelProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'markdownWysiwyg.aiAssistant';

	private _view?: vscode.WebviewView;
	private _universalInstructionsFolder?: vscode.Uri;
	private _relevantContextFolder?: vscode.Uri;

	constructor(
		private readonly _context: vscode.ExtensionContext,
	) {
		this._setupWorkspaceFolders();
	}

	/**
	 * Setup workspace folders for storing Universal Instructions and Relevant Context
	 */
	private async _setupWorkspaceFolders() {
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
		if (!workspaceFolder) {
			return;
		}

		const aiAssistantFolder = vscode.Uri.joinPath(workspaceFolder.uri, '.ai-assistant');
		this._universalInstructionsFolder = vscode.Uri.joinPath(aiAssistantFolder, 'universal-instructions');
		this._relevantContextFolder = vscode.Uri.joinPath(aiAssistantFolder, 'relevant-context');

		// Create folders if they don't exist
		try {
			await vscode.workspace.fs.createDirectory(this._universalInstructionsFolder);
			await vscode.workspace.fs.createDirectory(this._relevantContextFolder);
		} catch (error) {
			// Folders may already exist
		}
	}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				this._context.extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		// Handle messages from the webview
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
				case 'refresh':
					await this._refresh();
					break;
			}
		});

		// Initial refresh
		this._refresh();
	}

	/**
	 * Create a new Universal Instruction file
	 */
	private async _createUniversalInstruction() {
		if (!this._universalInstructionsFolder) {
			vscode.window.showErrorMessage('No workspace folder found. Please open a workspace first.');
			return;
		}

		const fileName = await vscode.window.showInputBox({
			prompt: 'Enter a name for the universal instruction',
			placeHolder: 'e.g., writing-style-preferences',
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

		const fileUri = vscode.Uri.joinPath(this._universalInstructionsFolder, `${fileName}.md`);

		// Create the file with a template
		const template = `# ${fileName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}

## Instructions

Describe your writing preferences here. For example:

- Use clear and concise language
- Avoid jargon and ambiguous terms
- Focus on factual, data-driven content
- Maintain a professional tone

Add any other preferences that will help AI assistants understand your writing style.
`;

		await vscode.workspace.fs.writeFile(fileUri, Buffer.from(template, 'utf8'));

		// Open the file
		await vscode.window.showTextDocument(fileUri);

		// Refresh the panel
		await this._refresh();
	}

	/**
	 * Create a new Relevant Context file
	 */
	private async _createRelevantContext() {
		if (!this._relevantContextFolder) {
			vscode.window.showErrorMessage('No workspace folder found. Please open a workspace first.');
			return;
		}

		const fileName = await vscode.window.showInputBox({
			prompt: 'Enter a name for the context file',
			placeHolder: 'e.g., project-data',
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

		const fileUri = vscode.Uri.joinPath(this._relevantContextFolder, `${fileName}.md`);

		// Create the file with a template
		const template = `# ${fileName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}

## Context Information

Add relevant context information here that AI assistants can reference when helping with your writing.

This might include:
- Data and statistics
- Examples to follow
- Background information
- References

`;

		await vscode.workspace.fs.writeFile(fileUri, Buffer.from(template, 'utf8'));

		// Open the file
		await vscode.window.showTextDocument(fileUri);

		// Refresh the panel
		await this._refresh();
	}

	/**
	 * Open a file in the editor
	 */
	private async _openFile(filePath: string) {
		const uri = vscode.Uri.file(filePath);
		await vscode.window.showTextDocument(uri);
	}

	/**
	 * Delete a file
	 */
	private async _deleteFile(filePath: string) {
		const uri = vscode.Uri.file(filePath);
		const fileName = path.basename(filePath);

		const answer = await vscode.window.showWarningMessage(
			`Are you sure you want to delete "${fileName}"?`,
			{ modal: true },
			'Delete'
		);

		if (answer === 'Delete') {
			await vscode.workspace.fs.delete(uri);
			await this._refresh();
		}
	}

	/**
	 * Refresh the panel by loading files from the workspace
	 */
	private async _refresh() {
		if (!this._view) {
			return;
		}

		const universalInstructions = await this._getFiles(this._universalInstructionsFolder, 'universal-instruction');
		const relevantContext = await this._getFiles(this._relevantContextFolder, 'context');

		this._view.webview.postMessage({
			type: 'refresh',
			universalInstructions,
			relevantContext
		});
	}

	/**
	 * Get all markdown files from a folder
	 */
	private async _getFiles(folder: vscode.Uri | undefined, type: 'universal-instruction' | 'context'): Promise<ResourceFile[]> {
		if (!folder) {
			return [];
		}

		try {
			const files = await vscode.workspace.fs.readDirectory(folder);
			return files
				.filter(([name]) => name.endsWith('.md'))
				.map(([name]) => ({
					name: name.replace('.md', ''),
					path: vscode.Uri.joinPath(folder, name).fsPath,
					type
				}))
				.sort((a, b) => a.name.localeCompare(b.name));
		} catch (error) {
			return [];
		}
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, 'media', 'panel.js'));
		const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, 'media', 'panel.css'));
		const codiconsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, 'node_modules', '@vscode/codicons', 'dist', 'codicon.css'));

		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src ${webview.cspSource}; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${codiconsUri}" rel="stylesheet" />
				<link href="${styleUri}" rel="stylesheet">
				<title>AI Assistant</title>
			</head>
			<body>
				<div class="panel-container">
					<div class="section">
						<div class="section-header">
							<h3>Universal Instructions</h3>
							<button class="icon-button" id="addUniversalInstruction" title="Add Universal Instruction">
								<i class="codicon codicon-add"></i>
							</button>
						</div>
						<div class="section-description">
							Save your writing preferences and style guidelines here. AI assistants will use these instructions when helping you write.
						</div>
						<div id="universalInstructionsList" class="file-list">
							<div class="empty-state">No universal instructions yet</div>
						</div>
					</div>

					<div class="section">
						<div class="section-header">
							<h3>Relevant Context</h3>
							<button class="icon-button" id="addRelevantContext" title="Add Relevant Context">
								<i class="codicon codicon-add"></i>
							</button>
						</div>
						<div class="section-description">
							Store reference materials, data, and examples that AI assistants can use when helping with your writing.
						</div>
						<div id="relevantContextList" class="file-list">
							<div class="empty-state">No context files yet</div>
						</div>
					</div>
				</div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}
