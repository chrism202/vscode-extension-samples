(function() {
	const vscode = acquireVsCodeApi();

	// Get button elements
	const addUniversalInstructionBtn = document.getElementById('addUniversalInstruction');
	const addRelevantContextBtn = document.getElementById('addRelevantContext');

	// Get list containers
	const universalInstructionsList = document.getElementById('universalInstructionsList');
	const relevantContextList = document.getElementById('relevantContextList');

	// Add event listeners
	addUniversalInstructionBtn.addEventListener('click', () => {
		vscode.postMessage({ type: 'createUniversalInstruction' });
	});

	addRelevantContextBtn.addEventListener('click', () => {
		vscode.postMessage({ type: 'createRelevantContext' });
	});

	// Listen for messages from the extension
	window.addEventListener('message', event => {
		const message = event.data;
		switch (message.type) {
			case 'updateFiles':
				updateFileList(universalInstructionsList, message.universalInstructions, 'No universal instructions yet. Click + to create one.');
				updateFileList(relevantContextList, message.relevantContext, 'No relevant context yet. Click + to create one.');
				break;
		}
	});

	function updateFileList(container, files, emptyMessage) {
		container.innerHTML = '';

		if (!files || files.length === 0) {
			const emptyState = document.createElement('p');
			emptyState.className = 'empty-state';
			emptyState.textContent = emptyMessage;
			container.appendChild(emptyState);
			return;
		}

		files.forEach(file => {
			const fileItem = document.createElement('div');
			fileItem.className = 'file-item';

			const fileName = document.createElement('span');
			fileName.className = 'file-name';
			fileName.textContent = file.name;
			fileName.title = file.path;
			fileName.addEventListener('click', () => {
				vscode.postMessage({
					type: 'openFile',
					filePath: file.path
				});
			});

			const deleteButton = document.createElement('button');
			deleteButton.className = 'delete-button';
			deleteButton.textContent = '×';
			deleteButton.title = 'Delete file';
			deleteButton.addEventListener('click', (e) => {
				e.stopPropagation();
				vscode.postMessage({
					type: 'deleteFile',
					filePath: file.path
				});
			});

			fileItem.appendChild(fileName);
			fileItem.appendChild(deleteButton);
			container.appendChild(fileItem);
		});
	}

	// Request initial file list
	vscode.postMessage({ type: 'getFiles' });
})();
