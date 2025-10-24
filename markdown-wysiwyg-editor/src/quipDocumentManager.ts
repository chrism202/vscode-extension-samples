import * as vscode from 'vscode';
import * as path from 'path';
import { QuipClient } from './quipClient';

interface QuipDocumentMapping {
	quipId: string;
	localPath: string;
	title: string;
	lastSyncedUsec: number;
}

export class QuipDocumentManager {
	private mappings: Map<string, QuipDocumentMapping> = new Map();
	private workspaceState: vscode.Memento;
	private quipFolder: vscode.Uri | undefined;

	constructor(
		private quipClient: QuipClient,
		private context: vscode.ExtensionContext,
	) {
		this.workspaceState = context.workspaceState;
		this.loadMappings();
	}

	private loadMappings(): void {
		const savedMappings = this.workspaceState.get<QuipDocumentMapping[]>('quipDocumentMappings', []);
		this.mappings.clear();
		for (const mapping of savedMappings) {
			this.mappings.set(mapping.quipId, mapping);
		}
	}

	private async saveMappings(): Promise<void> {
		const mappingsArray = Array.from(this.mappings.values());
		await this.workspaceState.update('quipDocumentMappings', mappingsArray);
	}

	private async ensureQuipFolder(): Promise<vscode.Uri> {
		if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
			throw new Error('No workspace folder is open. Please open a folder first.');
		}

		const workspaceRoot = vscode.workspace.workspaceFolders[0].uri;
		this.quipFolder = vscode.Uri.joinPath(workspaceRoot, '.quip-documents');

		// Create the folder if it doesn't exist
		try {
			await vscode.workspace.fs.stat(this.quipFolder);
		} catch {
			await vscode.workspace.fs.createDirectory(this.quipFolder);
		}

		return this.quipFolder;
	}

	private htmlToMarkdown(html: string): string {
		// Use TurnDown to convert HTML to Markdown
		// Note: In the actual webview, TurnDown is available. Here we need to handle it differently.
		// For now, we'll do a simple conversion. In production, you might want to use a Node.js
		// version of TurnDown or another library.

		// Simple HTML to Markdown conversion
		let markdown = html;

		// Remove HTML comments
		markdown = markdown.replace(/<!--[\s\S]*?-->/g, '');

		// Convert headings
		markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
		markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
		markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
		markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
		markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
		markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');

		// Convert bold
		markdown = markdown.replace(/<(?:strong|b)[^>]*>(.*?)<\/(?:strong|b)>/gi, '**$1**');

		// Convert italic
		markdown = markdown.replace(/<(?:em|i)[^>]*>(.*?)<\/(?:em|i)>/gi, '*$1*');

		// Convert code
		markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

		// Convert pre/code blocks
		markdown = markdown.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, '```\n$1\n```\n\n');
		markdown = markdown.replace(/<pre[^>]*>(.*?)<\/pre>/gis, '```\n$1\n```\n\n');

		// Convert links
		markdown = markdown.replace(/<a[^>]*href=["'](.*?)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)');

		// Convert images
		markdown = markdown.replace(/<img[^>]*src=["'](.*?)["'][^>]*alt=["'](.*?)["'][^>]*>/gi, '![$2]($1)');
		markdown = markdown.replace(/<img[^>]*src=["'](.*?)["'][^>]*>/gi, '![]($1)');

		// Convert unordered lists
		markdown = markdown.replace(/<ul[^>]*>/gi, '');
		markdown = markdown.replace(/<\/ul>/gi, '\n');
		markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');

		// Convert ordered lists
		markdown = markdown.replace(/<ol[^>]*>/gi, '');
		markdown = markdown.replace(/<\/ol>/gi, '\n');
		let listCounter = 0;
		markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, () => {
			listCounter++;
			return `${listCounter}. $1\n`;
		});

		// Convert blockquotes
		markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, (match, content) => {
			return content.split('\n').map((line: string) => `> ${line}`).join('\n') + '\n\n';
		});

		// Convert line breaks
		markdown = markdown.replace(/<br\s*\/?>/gi, '\n');

		// Convert paragraphs
		markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');

		// Convert divs
		markdown = markdown.replace(/<div[^>]*>(.*?)<\/div>/gi, '$1\n');

		// Remove remaining HTML tags
		markdown = markdown.replace(/<[^>]+>/g, '');

		// Decode HTML entities
		markdown = markdown.replace(/&nbsp;/g, ' ');
		markdown = markdown.replace(/&quot;/g, '"');
		markdown = markdown.replace(/&apos;/g, "'");
		markdown = markdown.replace(/&lt;/g, '<');
		markdown = markdown.replace(/&gt;/g, '>');
		markdown = markdown.replace(/&amp;/g, '&');

		// Clean up extra whitespace
		markdown = markdown.replace(/\n{3,}/g, '\n\n');
		markdown = markdown.trim();

		return markdown;
	}

	public async openQuipDocument(quipId: string, title: string): Promise<void> {
		try {
			// Get the document from Quip
			const thread = await this.quipClient.getThread(quipId);
			const html = thread.thread.html || thread.html || '';

			// Convert HTML to Markdown
			const markdown = this.htmlToMarkdown(html);

			// Ensure the .quip-documents folder exists
			const quipFolder = await this.ensureQuipFolder();

			// Create a safe filename from the title
			const safeTitle = title.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
			const filename = `${safeTitle}_${quipId.substring(0, 8)}.md`;
			const filePath = vscode.Uri.joinPath(quipFolder, filename);

			// Write the markdown content to the file
			const encoder = new TextEncoder();
			await vscode.workspace.fs.writeFile(filePath, encoder.encode(markdown));

			// Save the mapping
			this.mappings.set(quipId, {
				quipId,
				localPath: filePath.fsPath,
				title,
				lastSyncedUsec: thread.thread.updated_usec,
			});
			await this.saveMappings();

			// Open the file in the editor
			const document = await vscode.workspace.openTextDocument(filePath);
			await vscode.window.showTextDocument(document);

			vscode.window.showInformationMessage(`Opened Quip document: ${title}`);
		} catch (error) {
			if (error instanceof Error) {
				vscode.window.showErrorMessage(`Failed to open Quip document: ${error.message}`);
			}
			throw error;
		}
	}

	public async pushChangesToQuip(documentUri: vscode.Uri): Promise<void> {
		try {
			// Find the mapping for this local file
			const mapping = Array.from(this.mappings.values()).find(
				m => m.localPath === documentUri.fsPath
			);

			if (!mapping) {
				const result = await vscode.window.showWarningMessage(
					'This file is not linked to a Quip document. Would you like to create a new Quip document?',
					'Create New',
					'Cancel'
				);

				if (result === 'Create New') {
					await this.createNewQuipDocument(documentUri);
				}
				return;
			}

			// Read the local file content
			const fileContent = await vscode.workspace.fs.readFile(documentUri);
			const markdown = new TextDecoder().decode(fileContent);

			// Push to Quip using markdown format
			await this.quipClient.editDocument(
				mapping.quipId,
				markdown,
				'markdown',
				'replace'
			);

			// Update the mapping
			mapping.lastSyncedUsec = Date.now() * 1000; // Convert to microseconds
			await this.saveMappings();

			vscode.window.showInformationMessage(`Successfully pushed changes to Quip: ${mapping.title}`);
		} catch (error) {
			if (error instanceof Error) {
				vscode.window.showErrorMessage(`Failed to push changes to Quip: ${error.message}`);
			}
			throw error;
		}
	}

	public async createNewQuipDocument(documentUri?: vscode.Uri): Promise<void> {
		try {
			// Get document title from user
			const title = await vscode.window.showInputBox({
				prompt: 'Enter a title for the new Quip document',
				placeHolder: 'My Document',
			});

			if (!title) {
				return;
			}

			let content = '';
			let localPath: string | undefined;

			// If a document URI is provided, use its content
			if (documentUri) {
				const fileContent = await vscode.workspace.fs.readFile(documentUri);
				content = new TextDecoder().decode(fileContent);
				localPath = documentUri.fsPath;
			} else {
				// Create a new empty document
				content = '# ' + title + '\n\nStart writing here...';
			}

			// Create the document in Quip
			const thread = await this.quipClient.createDocument(title, content, 'markdown');
			const quipId = thread.thread.id;

			// If no local path, create a new file
			if (!localPath) {
				const quipFolder = await this.ensureQuipFolder();
				const safeTitle = title.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
				const filename = `${safeTitle}_${quipId.substring(0, 8)}.md`;
				const filePath = vscode.Uri.joinPath(quipFolder, filename);

				const encoder = new TextEncoder();
				await vscode.workspace.fs.writeFile(filePath, encoder.encode(content));
				localPath = filePath.fsPath;

				// Open the new file
				const document = await vscode.workspace.openTextDocument(filePath);
				await vscode.window.showTextDocument(document);
			}

			// Save the mapping
			this.mappings.set(quipId, {
				quipId,
				localPath,
				title,
				lastSyncedUsec: thread.thread.created_usec,
			});
			await this.saveMappings();

			vscode.window.showInformationMessage(`Created new Quip document: ${title}`);
		} catch (error) {
			if (error instanceof Error) {
				vscode.window.showErrorMessage(`Failed to create Quip document: ${error.message}`);
			}
			throw error;
		}
	}

	public getQuipIdForDocument(documentUri: vscode.Uri): string | undefined {
		const mapping = Array.from(this.mappings.values()).find(
			m => m.localPath === documentUri.fsPath
		);
		return mapping?.quipId;
	}

	public isQuipDocument(documentUri: vscode.Uri): boolean {
		return this.getQuipIdForDocument(documentUri) !== undefined;
	}
}
