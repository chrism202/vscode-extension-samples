import * as vscode from 'vscode';

interface QuipUser {
	id: string;
	name: string;
	emails: string[];
	starred_folder_id?: string;
	private_folder_id?: string;
}

interface QuipThread {
	thread: {
		id: string;
		title: string;
		type: string;
		created_usec: number;
		updated_usec: number;
		author_id: string;
		html: string;
		is_deleted?: boolean;
	};
	user_ids: string[];
	html?: string;
}

interface QuipFolder {
	folder: {
		id: string;
		title: string;
		created_usec: number;
		updated_usec: number;
		color?: string;
		parent_id?: string;
	};
	member_ids: string[];
	children?: QuipFolderChild[];
}

interface QuipFolderChild {
	thread_id?: string;
	folder_id?: string;
	title: string;
}

interface QuipEditResponse {
	thread: {
		id: string;
		title: string;
		html: string;
		updated_usec: number;
	};
}

export class QuipClient {
	private baseUrl = 'https://platform.quip.com/1';
	private accessToken: string | undefined;

	constructor() {
		this.loadAccessToken();
	}

	private loadAccessToken(): void {
		const config = vscode.workspace.getConfiguration('markdownWysiwyg.quip');
		this.accessToken = config.get<string>('accessToken');
	}

	public hasAccessToken(): boolean {
		return !!this.accessToken && this.accessToken.length > 0;
	}

	public updateAccessToken(token: string): void {
		this.accessToken = token;
	}

	private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
		if (!this.accessToken) {
			throw new Error('Quip access token not configured. Please set it in settings or use the "Set Quip Access Token" command.');
		}

		const url = `${this.baseUrl}${endpoint}`;
		const headers = {
			'Authorization': `Bearer ${this.accessToken}`,
			'Content-Type': 'application/json',
			...options.headers,
		};

		try {
			const response = await fetch(url, { ...options, headers });

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Quip API error (${response.status}): ${errorText}`);
			}

			return await response.json() as T;
		} catch (error) {
			if (error instanceof Error) {
				throw new Error(`Failed to connect to Quip API: ${error.message}`);
			}
			throw error;
		}
	}

	public async getCurrentUser(): Promise<QuipUser> {
		return this.makeRequest<QuipUser>('/users/current');
	}

	public async getFolder(folderId: string): Promise<QuipFolder> {
		return this.makeRequest<QuipFolder>(`/folders/${folderId}`);
	}

	public async getThread(threadId: string): Promise<QuipThread> {
		return this.makeRequest<QuipThread>(`/threads/${threadId}`);
	}

	public async getRecentThreads(): Promise<{ [key: string]: QuipThread }> {
		return this.makeRequest<{ [key: string]: QuipThread }>('/threads/recent');
	}

	public async createDocument(title: string, content: string, format: 'html' | 'markdown' = 'markdown', memberIds?: string[]): Promise<QuipThread> {
		const params = new URLSearchParams({
			title,
			content,
			format,
		});

		if (memberIds && memberIds.length > 0) {
			params.append('member_ids', memberIds.join(','));
		}

		return this.makeRequest<QuipThread>(`/threads/new-document?${params.toString()}`, {
			method: 'POST',
		});
	}

	public async editDocument(threadId: string, content: string, format: 'html' | 'markdown' = 'markdown', location: 'append' | 'prepend' | 'replace' = 'replace', sectionId?: string): Promise<QuipEditResponse> {
		const params = new URLSearchParams({
			thread_id: threadId,
			content,
			format,
		});

		// Map location to Quip API location codes
		const locationMap: { [key: string]: string } = {
			'append': '0',
			'prepend': '1',
			'replace': '4',
		};

		if (location === 'replace' && !sectionId) {
			// For full document replacement, we need to replace the entire document
			// Quip doesn't have a direct "replace all" but we can use section_id with the first section
			params.append('location', '4');
		} else if (sectionId) {
			params.append('location', '4'); // REPLACE_SECTION
			params.append('section_id', sectionId);
		} else {
			params.append('location', locationMap[location]);
		}

		return this.makeRequest<QuipEditResponse>(`/threads/edit-document?${params.toString()}`, {
			method: 'POST',
		});
	}

	public async deleteThread(threadId: string): Promise<void> {
		await this.makeRequest<void>(`/threads/delete?thread_id=${threadId}`, {
			method: 'POST',
		});
	}
}
