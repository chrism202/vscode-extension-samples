# Markdown WYSIWYG Editor

A simple What-You-See-Is-What-You-Get (WYSIWYG) editor for Markdown files in Visual Studio Code. This extension provides a user-friendly, Word-like editing experience for `.md` files.

## Features

- **WYSIWYG editing**: Edit markdown files with live formatting preview
- **Rich toolbar**: Quick access to common formatting options
- **Keyboard shortcuts**: Familiar shortcuts for bold (Ctrl+B) and italic (Ctrl+I)
- **Auto-save**: Changes are automatically saved to your markdown files
- **Full markdown support**: Headers, lists, links, code, blockquotes, and more

## Usage

### Opening a Markdown File with WYSIWYG Editor

1. Open any `.md` file in VS Code
2. Right-click in the editor area
3. Select **"Reopen Editor With..."**
4. Choose **"Markdown WYSIWYG Editor"**

Alternatively, you can:
- Click on the file in the Explorer
- Right-click and select **"Open With..."**
- Choose **"Markdown WYSIWYG Editor"**

### Toolbar Buttons

The editor provides a toolbar with the following formatting options:

- **B** - Bold text
- **I** - Italic text
- **H1**, **H2**, **H3** - Headers (levels 1-3)
- **•** - Bullet list (unordered list)
- **1.** - Numbered list (ordered list)
- **Link** - Insert hyperlink
- **</>** - Inline code
- **"** - Blockquote

### Keyboard Shortcuts

- **Ctrl+B** (Cmd+B on Mac) - Make text bold
- **Ctrl+I** (Cmd+I on Mac) - Make text italic

### Editing Tips

1. **Select text** and click a toolbar button to apply formatting
2. **Paste plain text** - The editor automatically converts pasted content to plain text
3. **Use keyboard shortcuts** for faster formatting
4. **Changes auto-save** - Your edits are automatically saved to the file

## Supported Markdown Features

- Headers (H1-H6)
- Bold and italic text
- Inline code
- Links
- Unordered (bullet) lists
- Ordered (numbered) lists
- Blockquotes
- Paragraphs

## Installation

### From Source

1. Clone or download this extension
2. Open the extension folder in VS Code
3. Run `npm install` to install dependencies
4. Run `npm run compile` to compile TypeScript
5. Press F5 to launch the Extension Development Host
6. Open a `.md` file and try the WYSIWYG editor

### Testing

1. Open the extension folder in VS Code
2. Press F5 to launch the Extension Development Host
3. In the new window, open the included `sample.md` file
4. Right-click and select **"Reopen Editor With..." → "Markdown WYSIWYG Editor"**
5. Try editing the content and using the toolbar buttons

## Technical Details

This extension uses:
- **Custom Editor API**: Registers a custom editor for `.md` files
- **Webview**: Provides a rich editing interface
- **ContentEditable**: Uses browser's built-in editing capabilities
- **Bidirectional conversion**: Converts between Markdown and HTML

## Development

### Project Structure

```
markdown-wysiwyg-editor/
├── src/
│   ├── extension.ts          # Extension entry point
│   ├── markdownEditor.ts     # Custom editor provider
│   ├── dispose.ts            # Disposable utilities
│   └── util.ts               # Utility functions
├── media/
│   ├── editor.js             # Webview JavaScript
│   ├── editor.css            # Editor styles
│   ├── vscode.css            # VS Code theme integration
│   └── reset.css             # CSS reset
├── package.json              # Extension manifest
└── tsconfig.json             # TypeScript configuration
```

### Building

```bash
npm install
npm run compile
```

### Running

Press F5 in VS Code to launch the extension in debug mode.

## Limitations

- This is a simple WYSIWYG editor focused on basic markdown features
- Complex markdown features (tables, footnotes, etc.) are not yet supported
- The editor converts markdown to HTML for editing, which may not preserve all formatting nuances

## License

MIT

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests.
