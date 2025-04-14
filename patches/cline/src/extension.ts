// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import { setTimeout as setTimeoutPromise } from "node:timers/promises"
import * as vscode from "vscode"
import { Logger } from "./services/logging/Logger"
import { createClineAPI } from "./exports"
import "./utils/path" // necessary to have access to String.prototype.toPosix
import { DIFF_VIEW_URI_SCHEME } from "./integrations/editor/DiffViewProvider"
import assert from "node:assert"
import { telemetryService } from "./services/telemetry/TelemetryService"
import { WebviewProvider } from "./core/webview"
import { createTestServer, shutdownTestServer } from "./services/test/TestServer"
import { ErrorService } from "./services/error/ErrorService"

// patrick
import {AutoApprovalSettings} from "./shared/AutoApprovalSettings"

/*
Built using https://github.com/microsoft/vscode-webview-ui-toolkit

Inspired by
https://github.com/microsoft/vscode-webview-ui-toolkit-samples/tree/main/default/weather-webview
https://github.com/microsoft/vscode-webview-ui-toolkit-samples/tree/main/frameworks/hello-world-react-cra

*/

let outputChannel: vscode.OutputChannel

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	outputChannel = vscode.window.createOutputChannel("Cline")
	context.subscriptions.push(outputChannel)

	ErrorService.initialize()
	Logger.initialize(outputChannel)
	Logger.log("Cline extension activated")

	const sidebarWebview = new WebviewProvider(context, outputChannel)

	vscode.commands.executeCommand("setContext", "cline.isDevMode", IS_DEV && IS_DEV === "true")
	vscode.commands.executeCommand("setContext", "cline.isTestMode", IS_TEST && IS_TEST === "true")

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(WebviewProvider.sideBarId, sidebarWebview, {
			webviewOptions: { retainContextWhenHidden: true },
		}),
	)

	context.subscriptions.push(
		vscode.commands.registerCommand("cline.plusButtonClicked", async (webview: any) => {
			const openChat = async (instance?: WebviewProvider) => {
				await instance?.controller.clearTask()
				await instance?.controller.postStateToWebview()
				await instance?.controller.postMessageToWebview({
					type: "action",
					action: "chatButtonClicked",
				})
			}
			const isSidebar = !webview
			if (isSidebar) {
				openChat(WebviewProvider.getSidebarInstance())
			} else {
				WebviewProvider.getTabInstances().forEach(openChat)
			}
		}),
	)

	context.subscriptions.push(
		vscode.commands.registerCommand("cline.mcpButtonClicked", (webview: any) => {
			const openMcp = (instance?: WebviewProvider) =>
				instance?.controller.postMessageToWebview({
					type: "action",
					action: "mcpButtonClicked",
				})
			const isSidebar = !webview
			if (isSidebar) {
				openMcp(WebviewProvider.getSidebarInstance())
			} else {
				WebviewProvider.getTabInstances().forEach(openMcp)
			}
		}),
	)

	const openClineInNewTab = async () => {
		Logger.log("Opening Cline in new tab")
		// (this example uses webviewProvider activation event which is necessary to deserialize cached webview, but since we use retainContextWhenHidden, we don't need to use that event)
		// https://github.com/microsoft/vscode-extension-samples/blob/main/webview-sample/src/extension.ts
		const tabWebview = new WebviewProvider(context, outputChannel)
		//const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined
		const lastCol = Math.max(...vscode.window.visibleTextEditors.map((editor) => editor.viewColumn || 0))

		// Check if there are any visible text editors, otherwise open a new group to the right
		const hasVisibleEditors = vscode.window.visibleTextEditors.length > 0
		if (!hasVisibleEditors) {
			await vscode.commands.executeCommand("workbench.action.newGroupRight")
		}
		const targetCol = hasVisibleEditors ? Math.max(lastCol + 1, 1) : vscode.ViewColumn.Two

		const panel = vscode.window.createWebviewPanel(WebviewProvider.tabPanelId, "Cline", targetCol, {
			enableScripts: true,
			retainContextWhenHidden: true,
			localResourceRoots: [context.extensionUri],
		})
		// TODO: use better svg icon with light and dark variants (see https://stackoverflow.com/questions/58365687/vscode-extension-iconpath)

		panel.iconPath = {
			light: vscode.Uri.joinPath(context.extensionUri, "assets", "icons", "robot_panel_light.png"),
			dark: vscode.Uri.joinPath(context.extensionUri, "assets", "icons", "robot_panel_dark.png"),
		}
		tabWebview.resolveWebviewView(panel)

		// Lock the editor group so clicking on files doesn't open them over the panel
		await setTimeoutPromise(100)
		await vscode.commands.executeCommand("workbench.action.lockEditorGroup")
	}

	context.subscriptions.push(vscode.commands.registerCommand("cline.popoutButtonClicked", openClineInNewTab))
	context.subscriptions.push(vscode.commands.registerCommand("cline.openInNewTab", openClineInNewTab))

	context.subscriptions.push(
		vscode.commands.registerCommand("cline.settingsButtonClicked", (webview: any) => {
			WebviewProvider.getAllInstances().forEach((instance) => {
				const openSettings = async (instance?: WebviewProvider) => {
					instance?.controller.postMessageToWebview({
						type: "action",
						action: "settingsButtonClicked",
					})
				}
				const isSidebar = !webview
				if (isSidebar) {
					openSettings(WebviewProvider.getSidebarInstance())
				} else {
					WebviewProvider.getTabInstances().forEach(openSettings)
				}
			})
		}),
	)

	context.subscriptions.push(
		vscode.commands.registerCommand("cline.historyButtonClicked", (webview: any) => {
			WebviewProvider.getAllInstances().forEach((instance) => {
				const openHistory = async (instance?: WebviewProvider) => {
					instance?.controller.postMessageToWebview({
						type: "action",
						action: "historyButtonClicked",
					})
				}
				const isSidebar = !webview
				if (isSidebar) {
					openHistory(WebviewProvider.getSidebarInstance())
				} else {
					WebviewProvider.getTabInstances().forEach(openHistory)
				}
			})
		}),
	)

	context.subscriptions.push(
		vscode.commands.registerCommand("cline.accountButtonClicked", (webview: any) => {
			WebviewProvider.getAllInstances().forEach((instance) => {
				const openAccount = async (instance?: WebviewProvider) => {
					instance?.controller.postMessageToWebview({
						type: "action",
						action: "accountButtonClicked",
					})
				}
				const isSidebar = !webview
				if (isSidebar) {
					openAccount(WebviewProvider.getSidebarInstance())
				} else {
					WebviewProvider.getTabInstances().forEach(openAccount)
				}
			})
		}),
	)

	/*
	We use the text document content provider API to show the left side for diff view by creating a virtual document for the original content. This makes it readonly so users know to edit the right side if they want to keep their changes.

	- This API allows you to create readonly documents in VSCode from arbitrary sources, and works by claiming an uri-scheme for which your provider then returns text contents. The scheme must be provided when registering a provider and cannot change afterwards.
	- Note how the provider doesn't create uris for virtual documents - its role is to provide contents given such an uri. In return, content providers are wired into the open document logic so that providers are always considered.
	https://code.visualstudio.com/api/extension-guides/virtual-documents
	*/
	const diffContentProvider = new (class implements vscode.TextDocumentContentProvider {
		provideTextDocumentContent(uri: vscode.Uri): string {
			return Buffer.from(uri.query, "base64").toString("utf-8")
		}
	})()
	context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(DIFF_VIEW_URI_SCHEME, diffContentProvider))

	// URI Handler
	const handleUri = async (uri: vscode.Uri) => {
		console.log("URI Handler called with:", {
			path: uri.path,
			query: uri.query,
			scheme: uri.scheme,
		})

		const path = uri.path
		const query = new URLSearchParams(uri.query.replace(/\+/g, "%2B"))
		const visibleWebview = WebviewProvider.getVisibleInstance()
		if (!visibleWebview) {
			return
		}
		switch (path) {
			case "/openrouter": {
				const code = query.get("code")
				if (code) {
					await visibleWebview?.controller.handleOpenRouterCallback(code)
				}
				break
			}
			case "/auth": {
				const token = query.get("token")
				const state = query.get("state")
				const apiKey = query.get("apiKey")

				console.log("Auth callback received:", {
					token: token,
					state: state,
					apiKey: apiKey,
				})

				// Validate state parameter
				if (!(await visibleWebview?.controller.validateAuthState(state))) {
					vscode.window.showErrorMessage("Invalid auth state")
					return
				}

				if (token && apiKey) {
					await visibleWebview?.controller.handleAuthCallback(token, apiKey)
				}
				break
			}
			default:
				break
		}
	}
	context.subscriptions.push(vscode.window.registerUriHandler({ handleUri }))

	// Register size testing commands in development mode
	if (IS_DEV && IS_DEV === "true") {
		// Use dynamic import to avoid loading the module in production
		import("./dev/commands/tasks")
			.then((module) => {
				const devTaskCommands = module.registerTaskCommands(context, sidebarWebview.controller)
				context.subscriptions.push(...devTaskCommands)
				Logger.log("Cline dev task commands registered")
			})
			.catch((error) => {
				Logger.log("Failed to register dev task commands: " + error)
			})
	}

	context.subscriptions.push(
		vscode.commands.registerCommand("cline.addToChat", async (range?: vscode.Range, diagnostics?: vscode.Diagnostic[]) => {
			const editor = vscode.window.activeTextEditor
			if (!editor) {
				return
			}

			// Use provided range if available, otherwise use current selection
			// (vscode command passes an argument in the first param by default, so we need to ensure it's a Range object)
			const textRange = range instanceof vscode.Range ? range : editor.selection
			const selectedText = editor.document.getText(textRange)

			if (!selectedText) {
				return
			}

			// Get the file path and language ID
			const filePath = editor.document.uri.fsPath
			const languageId = editor.document.languageId

			const visibleWebview = WebviewProvider.getVisibleInstance()
			await visibleWebview?.controller.addSelectedCodeToChat(
				selectedText,
				filePath,
				languageId,
				Array.isArray(diagnostics) ? diagnostics : undefined,
			)
		}),
	)

	context.subscriptions.push(
		vscode.commands.registerCommand("cline.addTerminalOutputToChat", async () => {
			const terminal = vscode.window.activeTerminal
			if (!terminal) {
				return
			}

			// Save current clipboard content
			const tempCopyBuffer = await vscode.env.clipboard.readText()

			try {
				// Copy the *existing* terminal selection (without selecting all)
				await vscode.commands.executeCommand("workbench.action.terminal.copySelection")

				// Get copied content
				let terminalContents = (await vscode.env.clipboard.readText()).trim()

				// Restore original clipboard content
				await vscode.env.clipboard.writeText(tempCopyBuffer)

				if (!terminalContents) {
					// No terminal content was copied (either nothing selected or some error)
					return
				}

				// [Optional] Any additional logic to process multi-line content can remain here
				// For example:
				/*
				const lines = terminalContents.split("\n")
				const lastLine = lines.pop()?.trim()
				if (lastLine) {
					let i = lines.length - 1
					while (i >= 0 && !lines[i].trim().startsWith(lastLine)) {
						i--
					}
					terminalContents = lines.slice(Math.max(i, 0)).join("\n")
				}
				*/

				// Send to sidebar provider
				const visibleWebview = WebviewProvider.getVisibleInstance()
				await visibleWebview?.controller.addSelectedTerminalOutputToChat(terminalContents, terminal.name)
			} catch (error) {
				// Ensure clipboard is restored even if an error occurs
				await vscode.env.clipboard.writeText(tempCopyBuffer)
				console.error("Error getting terminal contents:", error)
				vscode.window.showErrorMessage("Failed to get terminal contents")
			}
		}),
	)

	// Register code action provider
	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider(
			"*",
			new (class implements vscode.CodeActionProvider {
				public static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix]

				provideCodeActions(
					document: vscode.TextDocument,
					range: vscode.Range,
					context: vscode.CodeActionContext,
				): vscode.CodeAction[] {
					// Expand range to include surrounding 3 lines
					const expandedRange = new vscode.Range(
						Math.max(0, range.start.line - 3),
						0,
						Math.min(document.lineCount - 1, range.end.line + 3),
						document.lineAt(Math.min(document.lineCount - 1, range.end.line + 3)).text.length,
					)

					const addAction = new vscode.CodeAction("Add to Cline", vscode.CodeActionKind.QuickFix)
					addAction.command = {
						command: "cline.addToChat",
						title: "Add to Cline",
						arguments: [expandedRange, context.diagnostics],
					}

					const fixAction = new vscode.CodeAction("Fix with Cline", vscode.CodeActionKind.QuickFix)
					fixAction.command = {
						command: "cline.fixWithCline",
						title: "Fix with Cline",
						arguments: [expandedRange, context.diagnostics],
					}

					// Only show actions when there are errors
					if (context.diagnostics.length > 0) {
						return [addAction, fixAction]
					} else {
						return []
					}
				}
			})(),
			{
				providedCodeActionKinds: [vscode.CodeActionKind.QuickFix],
			},
		),
	)

	// Register the command handler
	context.subscriptions.push(
		vscode.commands.registerCommand("cline.fixWithCline", async (range: vscode.Range, diagnostics: any[]) => {
			const editor = vscode.window.activeTextEditor
			if (!editor) {
				return
			}

			const selectedText = editor.document.getText(range)
			const filePath = editor.document.uri.fsPath
			const languageId = editor.document.languageId

			// Send to sidebar provider with diagnostics
			const visibleWebview = WebviewProvider.getVisibleInstance()
			await visibleWebview?.controller.fixWithCline(selectedText, filePath, languageId, diagnostics)
		}),
	)

	// https://samuellawrentz.com/blog/git-commit-message-jira-extension/
	// vscode.window.showInputBox({
	//	prompt: 'Enter the ticket number'
    //}).then(ticketNumber => {

	// set Anthropic apiKey
	context.subscriptions.push(
		vscode.commands.registerCommand("cline.autocoder.setAnthropicKey", async () => {
			let apiKey = await vscode.window.showInputBox({ prompt : "Anthropic Key ", password : true }).then(keyEntered => {
				return keyEntered || ""
			})
			await context.secrets.store('apiKey', apiKey); //Save a keys
			// after settings are updated, post state to webview
			await sidebarWebview.controller.postStateToWebview()
			await sidebarWebview.controller.postMessageToWebview({ type: "didUpdateSettings" })
			
		})
	)

	// enable Anthropic provider
	context.subscriptions.push(
		vscode.commands.registerCommand("cline.autocoder.enableAnthropicProvider", async () => {
			await context.globalState.update("apiProvider", "anthropic")
			// after settings are updated, post state to webview
			await sidebarWebview.controller.postStateToWebview()
			await sidebarWebview.controller.postMessageToWebview({ type: "didUpdateSettings" })
			
		})
	)

	// enable Anthropic model
	context.subscriptions.push(
		vscode.commands.registerCommand("cline.autocoder.setAnthropicModel", async () => {
			let modelId = await vscode.window.showInputBox({ prompt : "Anthropic Model" }).then(modelEntered => {
				return modelEntered || ""
			})

			// claude-3-7-sonnet-20250219
			// claude-3-5-haiku-20241022

			await context.globalState.update("apiModelId", modelId)
			// after settings are updated, post state to webview
			await sidebarWebview.controller.postStateToWebview()
			await sidebarWebview.controller.postMessageToWebview({ type: "didUpdateSettings" })
			
		})
	)
	
	// disable telemetry
	context.subscriptions.push(
		vscode.commands.registerCommand("cline.autocoder.disableTelemetry", async () => {
			await context.globalState.update("telemetrySetting", false)
			// after settings are updated, post state to webview
			await sidebarWebview.controller.postStateToWebview()
			await sidebarWebview.controller.postMessageToWebview({ type: "didUpdateSettings" })
		})
	)

	// disable notification
	context.subscriptions.push(
		vscode.commands.registerCommand("cline.autocoder.disableNotifications", async () => {
			await context.globalState.update("lastShownAnnouncementId","april-11-2025")
			// after settings are updated, post state to webview
			await sidebarWebview.controller.postStateToWebview()
			await sidebarWebview.controller.postMessageToWebview({ type: "didUpdateSettings" })
		})
	)

	// https://docs.cline.bot/improving-your-prompting-skills/prompting	
	// we can use .clinerules (file or directory)
	/*
	// set instructions
	context.subscriptions.push(
		vscode.commands.registerCommand("cline.autocoder.setInstructions", async () => {
			let instructions = "Use nodejs and typescript. Make sure to also write tests. Add documentation . Make sure to use type safe. Install nodejs if needed. "
			await context.globalState.update("customInstructions",instructions)

			// after settings are updated, post state to webview
			await sidebarWebview.controller.postStateToWebview()
			await sidebarWebview.controller.postMessageToWebview({ type: "didUpdateSettings" })
		})
	)
	*/
	
	// all auto approval
	context.subscriptions.push(
		vscode.commands.registerCommand("cline.autocoder.yoloMode", async () => {
		// configure auto approval
		let settings: AutoApprovalSettings = {
			enabled: true,
			actions: {
				readFiles: true,
				readFilesExternally: false,
				editFiles: true,
				editFilesExternally: true,
				executeSafeCommands: true,
				executeAllCommands: true,
				useBrowser: false,
				useMcp: true,
			},
			maxRequests: 25,
			enableNotifications: false,
		}
		context.globalState.update("autoApprovalSettings",settings)
	
		// after settings are updated, post state to webview
		await sidebarWebview.controller.postStateToWebview()
		await sidebarWebview.controller.postMessageToWebview({ type: "didUpdateSettings" })
		})
	)


	context.subscriptions.push(
		vscode.commands.registerCommand("cline.autocoder.copySettings", async() => {

			Logger.log("Copying cline information")
			let information = ""

			let keys = context.globalState.keys()
			let ws_keys = context.workspaceState.keys()

			keys.forEach( (key) => {
				let value =  context.globalState.get(key)
				information = information + "(" + key + ":" + value + ")"
			});

			ws_keys.forEach( (key) => {
				let value =  context.globalState.get(key)
				information = information + "(" + key + ":" + value + ")"
			});

			let api_key = await context.secrets.get("apiKey")
			information = information + "(" + "apiKey" + ":" + api_key + ")"

			vscode.env.clipboard.writeText(information)

			// https://github.com/cline/cline/commit/d4f15de1998de2fab588d59c0acb2b24d53ea8e5#diff-7b174beb936944d6b455a5df46021272af42f3d706e1fc21876ce7dda01f0d70R19-R30
			// await sidebarWebview.controller.cancelTask()
			// https://github.com/cline/cline/blob/b3b074d90a084b1ebe2d3cd70d75b4a32ac8521e/src/exports/index.ts#L21
			// relinquishcontrol
			// chatButtonClicked
			//await sidebarWebview.controller.initTask("allaa")
			//sidebarWebview.controller.clearTask()
			//await sidebarWebview.controller.postStateToWebview()
			// await sidebarWebview.controller.postMessageToWebview({ type: "action", action: "chatButtonTapped" })
			//await sidebarWebview.controller.postMessageToWebview({type: "invoke", invoke: "sendMessage",text: "sometask",	images:[],})

		})
	)

	// Set up test server if in test mode
	if (IS_TEST === "true") {
		createTestServer(sidebarWebview)
	}

	return createClineAPI(outputChannel, sidebarWebview.controller)
}

// TODO: Find a solution for automatically removing DEV related content from production builds.
//  This type of code is fine in production to keep. We just will want to remove it from production builds
//  to bring down built asset sizes.
//
// This is a workaround to reload the extension when the source code changes
// since vscode doesn't support hot reload for extensions
const { IS_DEV, DEV_WORKSPACE_FOLDER, IS_TEST } = process.env

// This method is called when your extension is deactivated
export function deactivate() {
	// Shutdown the test server if it exists
	shutdownTestServer()

	telemetryService.shutdown()
	Logger.log("Cline extension deactivated")
}

// Set up development mode file watcher
if (IS_DEV && IS_DEV !== "false") {
	assert(DEV_WORKSPACE_FOLDER, "DEV_WORKSPACE_FOLDER must be set in development")
	const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(DEV_WORKSPACE_FOLDER, "src/**/*"))

	watcher.onDidChange(({ scheme, path }) => {
		console.info(`${scheme} ${path} changed. Reloading VSCode...`)

		vscode.commands.executeCommand("workbench.action.reloadWindow")
	})
}
