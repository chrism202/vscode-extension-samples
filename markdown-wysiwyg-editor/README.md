# Markdown WYSIWYG Editor

A simple What-You-See-Is-What-You-Get (WYSIWYG) editor for Markdown files in Visual Studio Code. This extension provides a user-friendly, Word-like editing experience for `.md` files.

## Features

- **WYSIWYG editing**: Edit markdown files with live formatting preview
- **Rich toolbar**: Quick access to common formatting options
- **Keyboard shortcuts**: Familiar shortcuts for bold (Ctrl+B) and italic (Ctrl+I)
- **Auto-save**: Changes are automatically saved to your markdown files
- **Full markdown support**: Headers, lists, links, code, blockquotes, and more
- **AI Assistant Panel**: Manage writing preferences and reference materials for AI coding assistants
- **Quip Integration**: Browse, open, edit, and sync Quip documents directly in VS Code

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

## Quip Integration

The extension provides seamless integration with Quip, allowing you to browse, open, edit, and sync your Quip documents directly within VS Code. Documents are automatically converted between Quip's HTML format and Markdown for local editing.

### Getting Started with Quip

#### 1. Get Your Quip Access Token

Before using the Quip integration, you need to generate a personal access token:

1. Visit [https://quip.com/dev/token](https://quip.com/dev/token)
2. Click **"Get Personal Access Token"**
3. Copy the generated token

#### 2. Set Your Access Token in VS Code

You can set your token in two ways:

**Option A: Using Settings**
1. Open VS Code Settings (Ctrl+, or Cmd+,)
2. Search for "Quip Access Token"
3. Paste your token in the **Markdown Wysiwyg > Quip: Access Token** field

**Option B: Using Command**
1. Open Command Palette (Ctrl+Shift+P or Cmd+Shift+P)
2. Search for **"Set Quip Access Token"**
3. Paste your token when prompted

### Using the Quip Explorer

Access the Quip Explorer by clicking the **cloud icon** in the Activity Bar.

#### Browsing Your Documents

The Quip Explorer shows:
- **Starred** - Your starred folders and documents
- **Private** - Your private folder contents
- **Recent Documents** - Documents you've recently accessed

Click the **▶** arrows to expand folders and see their contents.

#### Opening a Quip Document

To open and edit a Quip document locally:

1. Click on any document in the Quip Explorer
2. The document will be:
   - Downloaded from Quip
   - Converted to Markdown
   - Saved in `.quip-documents/` folder in your workspace
   - Opened in the editor

You can now edit the document locally in Markdown format.

#### Pushing Changes Back to Quip

After editing a Quip document locally:

1. Make sure the document is open in the editor
2. Click the **cloud upload icon** in the editor toolbar
   - Or use Command Palette: **"Push Changes to Quip"**
3. Your changes will be synced back to Quip

**Note:** Changes are pushed manually - they are not automatically synced.

#### Creating a New Quip Document

To create a new document:

1. Click the **+ (New File)** icon in the Quip Explorer toolbar
2. Enter a title for your document
3. A new document will be created in Quip and opened locally

You can also convert an existing local Markdown file to a Quip document by clicking the cloud upload icon when editing it.

#### Refreshing the Document List

Click the **refresh icon** in the Quip Explorer toolbar to reload your folders and documents from Quip.

### Understanding the Workflow

```
┌─────────────┐         Download          ┌──────────────────┐
│   Quip      │ ───────────────────────> │  Local Markdown  │
│  (HTML)     │                           │  (.quip-documents) │
└─────────────┘                           └──────────────────┘
      ▲                                            │
      │                                            │
      │            Push Changes                    │
      └────────────────────────────────────────────┘
```

1. **Browse**: View your Quip documents in the Quip Explorer
2. **Download**: Click a document to download it as Markdown
3. **Edit**: Make changes locally in your preferred editor
4. **Push**: Manually sync changes back to Quip

### File Storage

- Downloaded Quip documents are stored in **`.quip-documents/`** in your workspace root
- Files are named: `{title}_{quip-id}.md`
- The extension maintains a mapping between local files and Quip documents
- You can safely delete local files - they will be re-downloaded when needed

### Tips and Best Practices

- **Work offline**: Edit documents locally without an internet connection, then push changes when ready
- **Version control**: The `.quip-documents/` folder can be added to version control if desired
- **Multiple users**: This version doesn't handle merge conflicts - avoid simultaneous editing
- **Large documents**: Very large Quip documents may take longer to convert to Markdown

### Troubleshooting

**"Please set your Quip access token"**
- You need to configure your access token first (see Getting Started above)

**"Failed to connect to Quip API"**
- Check your internet connection
- Verify your access token is valid
- Try refreshing your token at https://quip.com/dev/token

**"This file is not linked to a Quip document"**
- This Markdown file wasn't downloaded from Quip
- You can create a new Quip document from it using the push changes command

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
│   ├── extension.ts              # Extension entry point
│   ├── markdownEditor.ts         # Custom editor provider
│   ├── aiAssistantPanel.ts       # AI Assistant panel provider
│   ├── quipClient.ts             # Quip API client service
│   ├── quipTreeProvider.ts       # Quip Explorer tree view provider
│   ├── quipDocumentManager.ts    # Document sync manager
│   ├── dispose.ts                # Disposable utilities
│   └── util.ts                   # Utility functions
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

### WYSIWYG Editor
- This is a simple WYSIWYG editor focused on basic markdown features
- Complex markdown features (tables, footnotes, etc.) are not yet supported
- The editor converts markdown to HTML for editing, which may not preserve all formatting nuances

### Quip Integration
- Synchronization conflicts between multiple users are not handled - changes may be overwritten
- No automatic sync - changes must be manually pushed to Quip
- HTML to Markdown conversion may not preserve all Quip-specific formatting
- Quip Live Apps are not supported
- Quip spreadsheets are treated as regular documents

## License

MIT

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests.
