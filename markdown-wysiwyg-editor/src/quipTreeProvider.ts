import * as vscode from 'vscode';
import { QuipClient } from './quipClient';

export class QuipTreeItem extends vscode.TreeItem {
	public readonly type: 'folder' | 'document';
	public readonly parentId?: string;

	constructor(
		id: string,
		label: string,
		type: 'folder' | 'document',
		collapsibleState: vscode.TreeItemCollapsibleState,
		parentId?: string,
	) {
		super(label, collapsibleState);
		this.id = id;
		this.type = type;
		this.parentId = parentId;
		this.contextValue = type === 'document' ? 'quipDocument' : 'quipFolder';
		this.tooltip = label;

		if (type === 'document') {
			this.iconPath = new vscode.ThemeIcon('file');
			this.command = {
				command: 'quip.openDocument',
				title: 'Open Document',
				arguments: [this],
			};
		} else {
			this.iconPath = new vscode.ThemeIcon('folder');
		}
	}
}

export class QuipTreeDataProvider implements vscode.TreeDataProvider<QuipTreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<QuipTreeItem | undefined | null | void> = new vscode.EventEmitter<QuipTreeItem | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<QuipTreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

	private folderCache: Map<string, any> = new Map();

	constructor(private quipClient: QuipClient) { }

	refresh(): void {
		this.folderCache.clear();
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: QuipTreeItem): vscode.TreeItem {
		return element;
	}

	async getChildren(element?: QuipTreeItem): Promise<QuipTreeItem[]> {
		if (!this.quipClient.hasAccessToken()) {
			vscode.window.showWarningMessage('Please set your Quip access token in settings to view documents.');
			return [];
		}

		try {
			if (!element) {
				// Root level - show user's main folders and recent documents
				return this.getRootItems();
			} else if (element.type === 'folder') {
				// Get folder contents
				return this.getFolderContents(element.id);
			} else {
				// Documents don't have children
				return [];
			}
		} catch (error) {
			if (error instanceof Error) {
				vscode.window.showErrorMessage(`Failed to load Quip items: ${error.message}`);
			}
			return [];
		}
	}

	private async getRootItems(): Promise<QuipTreeItem[]> {
		const items: QuipTreeItem[] = [];

		try {
			const user = await this.quipClient.getCurrentUser();

			// Add starred folder if available
			if (user.starred_folder_id) {
				items.push(new QuipTreeItem(
					user.starred_folder_id,
					'Starred',
					'folder',
					vscode.TreeItemCollapsibleState.Collapsed,
				));
			}

			// Add private folder if available
			if (user.private_folder_id) {
				items.push(new QuipTreeItem(
					user.private_folder_id,
					'Private',
					'folder',
					vscode.TreeItemCollapsibleState.Collapsed,
				));
			}

			// Add recent documents section
			items.push(new QuipTreeItem(
				'__recent__',
				'Recent Documents',
				'folder',
				vscode.TreeItemCollapsibleState.Expanded,
			));

		} catch (error) {
			console.error('Error loading root items:', error);
			throw error;
		}

		return items;
	}

	private async getFolderContents(folderId: string): Promise<QuipTreeItem[]> {
		const items: QuipTreeItem[] = [];

		try {
			// Special case for recent documents
			if (folderId === '__recent__') {
				const recentThreads = await this.quipClient.getRecentThreads();
				for (const [threadId, threadData] of Object.entries(recentThreads)) {
					if (threadData.thread && !threadData.thread.is_deleted) {
						items.push(new QuipTreeItem(
							threadId,
							threadData.thread.title || 'Untitled',
							'document',
							vscode.TreeItemCollapsibleState.None,
							folderId,
						));
					}
				}
				return items;
			}

			// Get folder from cache or API
			let folderData = this.folderCache.get(folderId);
			if (!folderData) {
				folderData = await this.quipClient.getFolder(folderId);
				this.folderCache.set(folderId, folderData);
			}

			// Process children
			if (folderData.children && Array.isArray(folderData.children)) {
				for (const child of folderData.children) {
					if (child.folder_id) {
						// It's a subfolder
						items.push(new QuipTreeItem(
							child.folder_id,
							child.title || 'Untitled Folder',
							'folder',
							vscode.TreeItemCollapsibleState.Collapsed,
							folderId,
						));
					} else if (child.thread_id) {
						// It's a document
						items.push(new QuipTreeItem(
							child.thread_id,
							child.title || 'Untitled',
							'document',
							vscode.TreeItemCollapsibleState.None,
							folderId,
						));
					}
				}
			}
		} catch (error) {
			console.error(`Error loading folder ${folderId}:`, error);
			throw error;
		}

		return items;
	}
}
