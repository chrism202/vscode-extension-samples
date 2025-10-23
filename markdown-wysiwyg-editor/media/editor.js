(function () {
	const vscode = acquireVsCodeApi();

	let currentContent = '';
	let isEditable = true;

	// Get references to DOM elements
	const editor = document.getElementById('editor');
	const toolbar = document.getElementById('toolbar');

	// Simple markdown to HTML converter
	function markdownToHtml(markdown) {
		let html = markdown;

		// Escape HTML first to prevent XSS
		html = html.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');

		// Headers
		html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
		html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
		html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

		// Bold
		html = html.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
		html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

		// Italic
		html = html.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
		html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

		// Code
		html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

		// Links
		html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>');

		// Blockquotes
		html = html.replace(/^&gt; (.*$)/gim, '<blockquote>$1</blockquote>');

		// Lists
		const lines = html.split('\n');
		let inList = false;
		let listType = null;
		const processed = [];

		for (let i = 0; i < lines.length; i++) {
			let line = lines[i];

			// Unordered list
			if (line.match(/^\s*[\*\-\+] /)) {
				if (!inList || listType !== 'ul') {
					if (inList) {
						processed.push(`</${listType}>`);
					}
					processed.push('<ul>');
					inList = true;
					listType = 'ul';
				}
				line = line.replace(/^\s*[\*\-\+] /, '<li>') + '</li>';
			}
			// Ordered list
			else if (line.match(/^\s*\d+\. /)) {
				if (!inList || listType !== 'ol') {
					if (inList) {
						processed.push(`</${listType}>`);
					}
					processed.push('<ol>');
					inList = true;
					listType = 'ol';
				}
				line = line.replace(/^\s*\d+\. /, '<li>') + '</li>';
			}
			// Not a list item
			else {
				if (inList) {
					processed.push(`</${listType}>`);
					inList = false;
					listType = null;
				}
			}

			processed.push(line);
		}

		if (inList) {
			processed.push(`</${listType}>`);
		}

		html = processed.join('\n');

		// Paragraphs (lines separated by blank lines)
		html = html.split('\n\n').map(para => {
			para = para.trim();
			if (!para) {
				return '';
			}
			// Don't wrap if already wrapped in a tag
			if (para.match(/^<(h[1-6]|ul|ol|blockquote|pre)/)) {
				return para;
			}
			return '<p>' + para + '</p>';
		}).join('\n');

		// Line breaks
		html = html.replace(/\n/g, '<br>');

		return html;
	}

	// Simple HTML to markdown converter
	function htmlToMarkdown(html) {
		let markdown = html;

		// Remove div wrappers and other container elements
		markdown = markdown.replace(/<div[^>]*>/gi, '');
		markdown = markdown.replace(/<\/div>/gi, '\n');

		// Headers
		markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n');
		markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n');
		markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n');
		markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n');
		markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n');
		markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n');

		// Bold
		markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
		markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');

		// Italic
		markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
		markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

		// Code
		markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

		// Links
		markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

		// Blockquotes
		markdown = markdown.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n');

		// Lists
		markdown = markdown.replace(/<ul[^>]*>/gi, '\n');
		markdown = markdown.replace(/<\/ul>/gi, '\n');
		markdown = markdown.replace(/<ol[^>]*>/gi, '\n');
		markdown = markdown.replace(/<\/ol>/gi, '\n');
		markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');

		// Paragraphs
		markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');

		// Line breaks
		markdown = markdown.replace(/<br\s*\/?>/gi, '\n');

		// Clean up HTML entities
		markdown = markdown.replace(/&lt;/g, '<');
		markdown = markdown.replace(/&gt;/g, '>');
		markdown = markdown.replace(/&amp;/g, '&');
		markdown = markdown.replace(/&quot;/g, '"');

		// Clean up extra whitespace
		markdown = markdown.replace(/\n{3,}/g, '\n\n');
		markdown = markdown.trim();

		return markdown;
	}

	// Update editor content
	function updateEditor(markdown) {
		currentContent = markdown;
		const html = markdownToHtml(markdown);
		editor.innerHTML = html;
	}

	// Handle editor changes
	function onEditorChange() {
		const markdown = htmlToMarkdown(editor.innerHTML);
		if (markdown !== currentContent) {
			currentContent = markdown;
			vscode.postMessage({
				type: 'edit',
				content: markdown
			});
		}
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
	function execCommand(command) {
		const selection = window.getSelection();
		const range = selection.getRangeCount() > 0 ? selection.getRangeAt(0) : null;

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

		switch (message.type) {
			case 'init':
				isEditable = message.editable;
				editor.contentEditable = isEditable;
				if (message.value) {
					updateEditor(message.value);
				}
				if (!isEditable) {
					toolbar.style.display = 'none';
				}
				break;

			case 'update':
				if (message.content !== undefined) {
					updateEditor(message.content);
				}
				break;

			case 'getFileData':
				vscode.postMessage({
					type: 'response',
					requestId: message.requestId,
					body: currentContent
				});
				break;
		}
	});

	// Notify the extension that we're ready
	vscode.postMessage({ type: 'ready' });
})();
