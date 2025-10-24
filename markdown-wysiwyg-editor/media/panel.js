(function () {
	const vscode = acquireVsCodeApi();

	// Get button references
	const addUniversalInstructionBtn = document.getElementById('addUniversalInstruction');
	const addRelevantContextBtn = document.getElementById('addRelevantContext');
	const universalInstructionsList = document.getElementById('universalInstructionsList');
	const relevantContextList = document.getElementById('relevantContextList');

	// Add event listeners for create buttons
	addUniversalInstructionBtn.addEventListener('click', () => {
		vscode.postMessage({ type: 'createUniversalInstruction' });
	});

	addRelevantContextBtn.addEventListener('click', () => {
		vscode.postMessage({ type: 'createRelevantContext' });
	});

	// Handle messages from extension
	window.addEventListener('message', event => {
		const message = event.data;

		switch (message.type) {
			case 'refresh':
				renderUniversalInstructions(message.universalInstructions || []);
				renderRelevantContext(message.relevantContext || []);
				break;
		}
	});

	/**
	 * Render Universal Instructions list
	 */
	function renderUniversalInstructions(files) {
		if (files.length === 0) {
			universalInstructionsList.innerHTML = '<div class="empty-state">No universal instructions yet</div>';
			return;
		}

		universalInstructionsList.innerHTML = files.map(file => createFileItem(file)).join('');
		attachFileItemListeners(universalInstructionsList);
	}

	/**
	 * Render Relevant Context list
	 */
	function renderRelevantContext(files) {
		if (files.length === 0) {
			relevantContextList.innerHTML = '<div class="empty-state">No context files yet</div>';
			return;
		}

		relevantContextList.innerHTML = files.map(file => createFileItem(file)).join('');
		attachFileItemListeners(relevantContextList);
	}

	/**
	 * Create HTML for a file item
	 */
	function createFileItem(file) {
		const displayName = formatFileName(file.name);
		return `
			<div class="file-item" data-path="${escapeHtml(file.path)}">
				<div class="file-item-content">
					<i class="codicon codicon-markdown file-item-icon"></i>
					<span class="file-item-name" title="${escapeHtml(displayName)}">${escapeHtml(displayName)}</span>
				</div>
				<div class="file-item-actions">
					<button class="file-item-action delete" title="Delete" data-action="delete">
						<i class="codicon codicon-trash"></i>
					</button>
				</div>
			</div>
		`;
	}

	/**
	 * Attach event listeners to file items
	 */
	function attachFileItemListeners(container) {
		container.querySelectorAll('.file-item').forEach(item => {
			const filePath = item.dataset.path;

			// Click to open file
			item.addEventListener('click', (e) => {
				// Don't open if clicking on action buttons
				if (e.target.closest('.file-item-action')) {
					return;
				}
				vscode.postMessage({
					type: 'openFile',
					filePath
				});
			});

			// Delete button
			const deleteBtn = item.querySelector('[data-action="delete"]');
			if (deleteBtn) {
				deleteBtn.addEventListener('click', (e) => {
					e.stopPropagation();
					vscode.postMessage({
						type: 'deleteFile',
						filePath
					});
				});
			}
		});
	}

	/**
	 * Format file name for display
	 */
	function formatFileName(name) {
		return name
			.replace(/-/g, ' ')
			.replace(/\b\w/g, l => l.toUpperCase());
	}

	/**
	 * Escape HTML to prevent XSS
	 */
	function escapeHtml(unsafe) {
		return unsafe
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#039;");
	}

	// Request initial refresh
	vscode.postMessage({ type: 'refresh' });
})();
