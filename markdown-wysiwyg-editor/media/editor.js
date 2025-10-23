(function () {
	const vscode = acquireVsCodeApi();

	let currentContent = '';
	let isEditable = true;
	let isInitialized = false;
	const pendingGetFileData = [];
	let savedSelection = null;

	// Get references to DOM elements
	const editor = document.getElementById('editor');
	const toolbar = document.getElementById('toolbar');

	if (window.marked) {
		window.marked.setOptions({
			breaks: true,
			gfm: true
		});
	}

	const turndownService = window.TurndownService ? new window.TurndownService({
		headingStyle: 'atx',
		hr: '---',
		bulletListMarker: '-',
		codeBlockStyle: 'fenced'
	}) : null;

	function markdownToHtml(markdown) {
		if (!window.marked) {
			return markdown;
		}
		return window.marked.parse(markdown ?? '');
	}

		function htmlToMarkdown(html) {
			if (!turndownService) {
				return html ?? '';
			}
			return turndownService.turndown(html ?? '').trim();
		}

	// Update editor content
	function updateEditor(markdown) {
		currentContent = markdown;
		const html = markdownToHtml(markdown);
		editor.innerHTML = html;
		savedSelection = null;
	}

	// Handle editor changes
	function syncContentWithDom() {
		const markdown = htmlToMarkdown(editor.innerHTML);
		if (markdown !== currentContent) {
			currentContent = markdown;
			vscode.postMessage({
				type: 'edit',
				content: markdown
			});
		}
	}

	function onEditorChange() {
		syncContentWithDom();
	}

	// Debounce function to avoid too many updates
	function debounce(func, wait) {
		let timeout;
		return function executedFunction(...args) {
			const later = () => {
				clearTimeout(timeout);
				func(...args);
			};
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
		};
	}

	const debouncedOnEditorChange = debounce(onEditorChange, 300);

	// Handle toolbar commands
	function saveSelection() {
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) {
			savedSelection = null;
			return;
		}
		const range = selection.getRangeAt(0);
		if (!editor.contains(range.commonAncestorContainer)) {
			savedSelection = null;
			return;
		}
		savedSelection = range.cloneRange();
	}

	function restoreSelection() {
		if (!savedSelection) {
			return window.getSelection();
		}
		const selection = window.getSelection();
		if (!selection) {
			return null;
		}
		selection.removeAllRanges();
		selection.addRange(savedSelection);
		return selection;
	}

	function execCommand(command) {
		editor.focus();
		const selection = restoreSelection() ?? window.getSelection();
		const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

		switch (command) {
			case 'bold':
				document.execCommand('bold', false, null);
				break;
			case 'italic':
				document.execCommand('italic', false, null);
				break;
			case 'heading1':
				document.execCommand('formatBlock', false, '<h1>');
				break;
			case 'heading2':
				document.execCommand('formatBlock', false, '<h2>');
				break;
			case 'heading3':
				document.execCommand('formatBlock', false, '<h3>');
				break;
			case 'bulletList':
				document.execCommand('insertUnorderedList', false, null);
				break;
			case 'numberedList':
				document.execCommand('insertOrderedList', false, null);
				break;
			case 'link':
				const url = prompt('Enter URL:');
				if (url) {
					document.execCommand('createLink', false, url);
				}
				break;
			case 'code':
				if (range && !range.collapsed) {
					const code = document.createElement('code');
					code.textContent = range.toString();
					range.deleteContents();
					range.insertNode(code);
				}
				break;
			case 'quote':
				document.execCommand('formatBlock', false, '<blockquote>');
				break;
		}

		editor.focus();
		saveSelection();
		onEditorChange();
	}

	// Set up toolbar button handlers
	toolbar.addEventListener('click', (e) => {
		const button = e.target.closest('[data-command]');
		if (button) {
			e.preventDefault();
			const command = button.dataset.command;
			execCommand(command);
		}
	});

	// Set up editor event listeners
	editor.addEventListener('input', debouncedOnEditorChange);
	editor.addEventListener('keyup', saveSelection);
	editor.addEventListener('mouseup', saveSelection);
	editor.addEventListener('mouseleave', saveSelection);
	editor.addEventListener('paste', (e) => {
		e.preventDefault();
		const text = e.clipboardData.getData('text/plain');
		document.execCommand('insertText', false, text);
	});

	// Keyboard shortcuts
	editor.addEventListener('keydown', (e) => {
		if (e.ctrlKey || e.metaKey) {
			switch (e.key) {
				case 'b':
					e.preventDefault();
					execCommand('bold');
					break;
				case 'i':
					e.preventDefault();
					execCommand('italic');
					break;
			}
		}
	});

	// Handle messages from the extension
	window.addEventListener('message', event => {
		const message = event.data;

		const payload = message.body ?? {};

		switch (message.type) {
			case 'init':
				isEditable = payload.editable ?? true;
				editor.contentEditable = isEditable;
				updateEditor(payload.value ?? '');
				if (!isEditable) {
					toolbar.style.display = 'none';
				}
				isInitialized = true;
				flushPendingGetFileData();
				break;

			case 'update':
				if (payload.content !== undefined) {
					updateEditor(payload.content);
				}
				break;

			case 'getFileData':
				if (typeof message.requestId !== 'number') {
					break;
				}
				if (!isInitialized) {
					pendingGetFileData.push(message.requestId);
					break;
				}
				respondWithCurrentContent(message.requestId);
				break;
		}
	});

	function respondWithCurrentContent(requestId) {
		syncContentWithDom();
		vscode.postMessage({
			type: 'response',
			requestId,
			body: currentContent
		});
	}

	function flushPendingGetFileData() {
		while (pendingGetFileData.length) {
			const requestId = pendingGetFileData.shift();
			respondWithCurrentContent(requestId);
		}
	}

	// Notify the extension that we're ready
	vscode.postMessage({ type: 'ready' });
})();
