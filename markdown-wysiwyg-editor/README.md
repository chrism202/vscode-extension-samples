# Markdown WYSIWYG Editor

A simple What-You-See-Is-What-You-Get (WYSIWYG) editor for Markdown files in Visual Studio Code. This extension provides a user-friendly, Word-like editing experience for `.md` files.

## Features

- **WYSIWYG editing**: Edit markdown files with live formatting preview
- **Rich toolbar**: Quick access to common formatting options
- **Keyboard shortcuts**: Familiar shortcuts for bold (Ctrl+B) and italic (Ctrl+I)
- **Auto-save**: Changes are automatically saved to your markdown files
- **Full markdown support**: Headers, lists, links, code, blockquotes, and more
- **AI Assistant Panel**: Manage writing preferences and reference materials for AI coding assistants

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

## AI Writing Assistant Panel

The extension includes an AI Writing Assistant panel designed to work with AI coding agents like Copilot and other AI assistants. Access it by clicking the sparkle icon in the Activity Bar.

### Universal Instructions

Store your writing preferences and style guidelines that AI assistants should follow when helping you write.

**To create a Universal Instruction:**
1. Click the **AI Writing Assistant** icon in the Activity Bar (sparkle icon)
2. In the "Universal Instructions" section, click the **+** button
3. Enter a name for your instruction (e.g., "writing-style-preferences")
4. Edit the markdown file to describe your preferences

**Example Universal Instructions:**
- Writing tone and style preferences (formal, casual, technical, etc.)
- Language guidelines (avoid jargon, use active voice, etc.)
- Formatting preferences
- Domain-specific terminology

**Location:** Files are saved in `.ai-assistant/universal-instructions/` in your workspace.

### Relevant Context

Store reference materials, data, and examples that AI assistants can use when helping with your writing.

**To create a Relevant Context file:**
1. Click the **AI Writing Assistant** icon in the Activity Bar
2. In the "Relevant Context" section, click the **+** button
3. Enter a name for your context file (e.g., "project-data")
4. Add your reference materials to the markdown file

**Example Relevant Context:**
- Data and statistics to reference
- Code examples or patterns to follow
- Background information about your project
- Templates or writing samples

**Location:** Files are saved in `.ai-assistant/relevant-context/` in your workspace.

### Managing Files

- **Open a file**: Click on any file in the panel to open it in the editor
- **Delete a file**: Hover over a file and click the trash icon
- Files are stored as markdown documents in your workspace
- The `.ai-assistant` folder is created automatically in your workspace root

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
│   ├── aiAssistantPanel.ts   # AI Assistant panel provider
│   ├── dispose.ts            # Disposable utilities
│   └── util.ts               # Utility functions
├── media/
│   ├── editor.js             # Webview JavaScript for editor
│   ├── editor.css            # Editor styles
│   ├── panel.js              # AI Assistant panel JavaScript
│   ├── panel.css             # AI Assistant panel styles
│   ├── vscode.css            # VS Code theme integration
│   ├── reset.css             # CSS reset
│   └── lib/                  # External libraries (marked, turndown)
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
