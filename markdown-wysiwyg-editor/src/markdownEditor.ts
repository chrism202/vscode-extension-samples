import * as vscode from 'vscode';
import { Disposable, disposeAll } from './dispose';
import { getNonce } from './util';

interface MarkdownEdit {
	readonly content: string;
}

interface MarkdownDocumentDelegate {
	getFileData(): Promise<Uint8Array>;
}

/**
 * Document model for markdown files.
 */
class MarkdownDocument extends Disposable implements vscode.CustomDocument {

	static async create(
		uri: vscode.Uri,
		backupId: string | undefined,
		delegate: MarkdownDocumentDelegate,
	): Promise<MarkdownDocument | PromiseLike<MarkdownDocument>> {
		const dataFile = typeof backupId === 'string' ? vscode.Uri.parse(backupId) : uri;
		const fileData = await MarkdownDocument.readFile(dataFile);
		return new MarkdownDocument(uri, fileData, delegate);
	}

	private static async readFile(uri: vscode.Uri): Promise<string> {
		if (uri.scheme === 'untitled') {
			return '';
		}
		const fileData = await vscode.workspace.fs.readFile(uri);
		return new TextDecoder().decode(fileData);
	}

	private readonly _uri: vscode.Uri;
	private _documentData: string;
	private _edits: MarkdownEdit[] = [];
	private _savedEdits: MarkdownEdit[] = [];
	private readonly _delegate: MarkdownDocumentDelegate;

	private constructor(
		uri: vscode.Uri,
		initialContent: string,
		delegate: MarkdownDocumentDelegate
	) {
		super();
		this._uri = uri;
		this._documentData = initialContent;
		this._delegate = delegate;
	}

	public get uri() { return this._uri; }
	public get documentData(): string { return this._documentData; }

	private readonly _onDidDispose = this._register(new vscode.EventEmitter<void>());
	public readonly onDidDispose = this._onDidDispose.event;

	private readonly _onDidChangeDocument = this._register(new vscode.EventEmitter<{
		readonly content: string;
	}>());
	public readonly onDidChangeContent = this._onDidChangeDocument.event;

	private readonly _onDidChange = this._register(new vscode.EventEmitter<{
		readonly label: string,
		undo(): void,
		redo(): void,
	}>());
	public readonly onDidChange = this._onDidChange.event;

	dispose(): void {
		this._onDidDispose.fire();
		super.dispose();
	}

	makeEdit(edit: MarkdownEdit) {
		const prevContent = this._documentData;
		this._documentData = edit.content;
		this._edits.push(edit);

		this._onDidChange.fire({
			label: 'Edit',
			undo: async () => {
				this._edits.pop();
				this._documentData = prevContent;
				this._onDidChangeDocument.fire({
					content: prevContent,
				});
			},
			redo: async () => {
				this._edits.push(edit);
				this._documentData = edit.content;
				this._onDidChangeDocument.fire({
					content: edit.content,
				});
			}
		});
	}

	async save(cancellation: vscode.CancellationToken): Promise<void> {
		await this.saveAs(this.uri, cancellation);
		this._savedEdits = Array.from(this._edits);
	}

	async saveAs(targetResource: vscode.Uri, cancellation: vscode.CancellationToken): Promise<void> {
		const fileData = await this._delegate.getFileData();
		if (cancellation.isCancellationRequested) {
			return;
		}
		await vscode.workspace.fs.writeFile(targetResource, fileData);
	}

	async revert(_cancellation: vscode.CancellationToken): Promise<void> {
		const diskContent = await MarkdownDocument.readFile(this.uri);
		this._documentData = diskContent;
		this._edits = this._savedEdits;
		this._onDidChangeDocument.fire({
			content: diskContent,
		});
	}

	async backup(destination: vscode.Uri, cancellation: vscode.CancellationToken): Promise<vscode.CustomDocumentBackup> {
		await this.saveAs(destination, cancellation);

		return {
			id: destination.toString(),
			delete: async () => {
				try {
					await vscode.workspace.fs.delete(destination);
				} catch {
					// noop
				}
			}
		};
	}
}

/**
 * Provider for markdown WYSIWYG editors.
 */
export class MarkdownWysiwygEditorProvider implements vscode.CustomEditorProvider<MarkdownDocument> {

	public static register(context: vscode.ExtensionContext): vscode.Disposable {
		return vscode.window.registerCustomEditorProvider(
			MarkdownWysiwygEditorProvider.viewType,
			new MarkdownWysiwygEditorProvider(context),
			{
				webviewOptions: {
					retainContextWhenHidden: true,
				},
				supportsMultipleEditorsPerDocument: false,
			});
	}

	private static readonly viewType = 'markdownWysiwyg.editor';

	private readonly webviews = new WebviewCollection();

	constructor(
		private readonly _context: vscode.ExtensionContext
	) { }

	async openCustomDocument(
		uri: vscode.Uri,
		openContext: { backupId?: string },
		_token: vscode.CancellationToken
	): Promise<MarkdownDocument> {
		const document: MarkdownDocument = await MarkdownDocument.create(uri, openContext.backupId, {
			getFileData: async () => {
				const webviewsForDocument = Array.from(this.webviews.get(document.uri));
				if (!webviewsForDocument.length) {
					throw new Error('Could not find webview to save for');
				}
				const panel = webviewsForDocument[0];
				const response = await this.postMessageWithResponse<string>(panel, 'getFileData', {});
				return new TextEncoder().encode(response);
			}
		});

		const listeners: vscode.Disposable[] = [];

		listeners.push(document.onDidChange(e => {
			this._onDidChangeCustomDocument.fire({
				document,
				...e,
			});
		}));

		listeners.push(document.onDidChangeContent(e => {
			for (const webviewPanel of this.webviews.get(document.uri)) {
				this.postMessage(webviewPanel, 'update', {
					content: e.content,
				});
			}
		}));

		document.onDidDispose(() => disposeAll(listeners));

		return document;
	}

	async resolveCustomEditor(
		document: MarkdownDocument,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken
	): Promise<void> {
		this.webviews.add(document.uri, webviewPanel);

		webviewPanel.webview.options = {
			enableScripts: true,
		};
		webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

		webviewPanel.webview.onDidReceiveMessage(e => this.onMessage(document, e));

		webviewPanel.webview.onDidReceiveMessage(e => {
			if (e.type === 'ready') {
				const editable = document.uri.scheme === 'untitled' ||
					vscode.workspace.fs.isWritableFileSystem(document.uri.scheme);

				this.postMessage(webviewPanel, 'init', {
					value: document.documentData,
					editable,
				});
			}
		});
	}

	private readonly _onDidChangeCustomDocument = new vscode.EventEmitter<vscode.CustomDocumentEditEvent<MarkdownDocument>>();
	public readonly onDidChangeCustomDocument = this._onDidChangeCustomDocument.event;

	public saveCustomDocument(document: MarkdownDocument, cancellation: vscode.CancellationToken): Thenable<void> {
		return document.save(cancellation);
	}

	public saveCustomDocumentAs(document: MarkdownDocument, destination: vscode.Uri, cancellation: vscode.CancellationToken): Thenable<void> {
		return document.saveAs(destination, cancellation);
	}

	public revertCustomDocument(document: MarkdownDocument, cancellation: vscode.CancellationToken): Thenable<void> {
		return document.revert(cancellation);
	}

	public backupCustomDocument(document: MarkdownDocument, context: vscode.CustomDocumentBackupContext, cancellation: vscode.CancellationToken): Thenable<vscode.CustomDocumentBackup> {
		return document.backup(context.destination, cancellation);
	}

	private getHtmlForWebview(webview: vscode.Webview): string {
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this._context.extensionUri, 'media', 'editor.js'));

		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this._context.extensionUri, 'media', 'reset.css'));

		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this._context.extensionUri, 'media', 'vscode.css'));

		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this._context.extensionUri, 'media', 'editor.css'));

		const nonce = getNonce();

		return /* html */`
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleResetUri}" rel="stylesheet" />
				<link href="${styleVSCodeUri}" rel="stylesheet" />
				<link href="${styleMainUri}" rel="stylesheet" />
				<title>Markdown WYSIWYG Editor</title>
			</head>
			<body>
				<div id="toolbar" class="toolbar">
					<button data-command="bold" title="Bold (Ctrl+B)" class="toolbar-button">
						<strong>B</strong>
					</button>
					<button data-command="italic" title="Italic (Ctrl+I)" class="toolbar-button">
						<em>I</em>
					</button>
					<button data-command="heading1" title="Heading 1" class="toolbar-button">H1</button>
					<button data-command="heading2" title="Heading 2" class="toolbar-button">H2</button>
					<button data-command="heading3" title="Heading 3" class="toolbar-button">H3</button>
					<span class="toolbar-separator"></span>
					<button data-command="bulletList" title="Bullet List" class="toolbar-button">•</button>
					<button data-command="numberedList" title="Numbered List" class="toolbar-button">1.</button>
					<span class="toolbar-separator"></span>
					<button data-command="link" title="Insert Link" class="toolbar-button">Link</button>
					<button data-command="code" title="Code" class="toolbar-button">&lt;/&gt;</button>
					<button data-command="quote" title="Quote" class="toolbar-button">"</button>
				</div>
				<div id="editor" class="editor" contenteditable="true"></div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}

	private _requestId = 1;
	private readonly _callbacks = new Map<number, (response: any) => void>();

	private postMessageWithResponse<R = unknown>(panel: vscode.WebviewPanel, type: string, body: any): Promise<R> {
		const requestId = this._requestId++;
		const p = new Promise<R>(resolve => this._callbacks.set(requestId, resolve));
		panel.webview.postMessage({ type, requestId, body });
		return p;
	}

	private postMessage(panel: vscode.WebviewPanel, type: string, body: any): void {
		panel.webview.postMessage({ type, body });
	}

	private onMessage(document: MarkdownDocument, message: any) {
		switch (message.type) {
			case 'edit':
				document.makeEdit({ content: message.content });
				return;

			case 'response':
				{
					const callback = this._callbacks.get(message.requestId);
					callback?.(message.body);
					return;
				}
		}
	}
}

class WebviewCollection {
	private readonly _webviews = new Set<{
		readonly resource: string;
		readonly webviewPanel: vscode.WebviewPanel;
	}>();

	public *get(uri: vscode.Uri): Iterable<vscode.WebviewPanel> {
		const key = uri.toString();
		for (const entry of this._webviews) {
			if (entry.resource === key) {
				yield entry.webviewPanel;
			}
		}
	}

	public add(uri: vscode.Uri, webviewPanel: vscode.WebviewPanel) {
		const entry = { resource: uri.toString(), webviewPanel };
		this._webviews.add(entry);

		webviewPanel.onDidDispose(() => {
			this._webviews.delete(entry);
		});
	}
}
