import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

let outputChannel: vscode.OutputChannel;

function log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : 'ℹ️';
    const logMessage = `[${timestamp}] ${prefix} ${message}`;

    outputChannel.appendLine(logMessage);

    if (level === 'error') {
        console.error(logMessage);
    } else if (level === 'warn') {
        console.warn(logMessage);
    } else {
        console.log(logMessage);
    }
}

let statusBarItem: vscode.StatusBarItem;

function updateStatusBar(configured: boolean) {
    if (!statusBarItem) {
        return;
    }
    if (configured) {
        statusBarItem.text = '$(check) DD: Connected';
        statusBarItem.tooltip = 'Datadog Observability — Connected';
        statusBarItem.backgroundColor = undefined;
    } else {
        statusBarItem.text = '$(warning) DD: Not Configured';
        statusBarItem.tooltip = 'Datadog Observability — Click to configure';
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    }
    statusBarItem.command = 'datadogObservability.configure';
    statusBarItem.show();
}

export function activate(context: vscode.ExtensionContext) {
    outputChannel = vscode.window.createOutputChannel('Datadog Observability', { log: true });
    context.subscriptions.push(outputChannel);

    log('Datadog Observability extension is now active!');
    log(`Extension path: ${context.extensionPath}`);

    // Status bar
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    context.subscriptions.push(statusBarItem);

    let mcpAvailable = false;
    const mcpServerPath = path.join(context.extensionPath, 'mcp-server', 'index.js');

    // Async initialization
    (async () => {
        const apiKey = await context.secrets.get('datadogObservability.apiKey');
        const appKey = await context.secrets.get('datadogObservability.appKey');
        const hasCredentials = !!(apiKey && appKey);

        const config = vscode.workspace.getConfiguration('datadogObservability');
        const site = config.get<string>('site', 'datadoghq.com');
        const logLevel = config.get<string>('logLevel', 'info');
        const autoStart = config.get<boolean>('autoStart', true);
        const maxResults = config.get<number>('maxResults', 50);

        updateStatusBar(hasCredentials);

        if (!hasCredentials) {
            log('Datadog credentials not configured. Use "Configure Datadog Credentials" command.', 'warn');
        }

        // Register MCP Server Definition Provider
        if (autoStart) {
            try {
                log(`MCP Server path: ${mcpServerPath}`);

                if (!fs.existsSync(mcpServerPath)) {
                    log(`MCP Server file not found at: ${mcpServerPath}`, 'warn');
                    log('Please build the project: npm run build && npm run copy-to-extension', 'warn');
                } else {
                    log('MCP Server file found successfully');
                }

                if (typeof vscode.lm?.registerMcpServerDefinitionProvider === 'function') {
                    const env: Record<string, string> = {
                        DD_SITE: site,
                        DD_MAX_RESULTS: String(maxResults),
                        DD_LOG_LEVEL: logLevel,
                    };

                    if (apiKey) { env.DD_API_KEY = apiKey; }
                    if (appKey) { env.DD_APP_KEY = appKey; }

                    context.subscriptions.push(
                        vscode.lm.registerMcpServerDefinitionProvider('datadog-observability', {
                            provideMcpServerDefinitions() {
                                log('Providing MCP Server definitions...');
                                return [
                                    new vscode.McpStdioServerDefinition(
                                        'datadog-observability',
                                        'node',
                                        [mcpServerPath],
                                        env
                                    )
                                ];
                            }
                        })
                    );
                    log('MCP Server Definition Provider registered successfully');
                    mcpAvailable = true;
                } else {
                    log('MCP API not available in this VS Code version', 'warn');
                }
            } catch (error) {
                log(`MCP registration failed: ${error}`, 'warn');
                log('Extension will continue without MCP');
            }
        }

        if (!hasCredentials) {
            log('Datadog credentials not yet configured. Tools will guide the user when invoked.', 'warn');
        }

        // Show welcome per version (resets on update)
        {
            const currentVersion = context.extension.packageJSON.version || '1.0.0';
            const welcomeShownForVersion = context.globalState.get<string>('welcomeShownForVersion', '');
            if (welcomeShownForVersion !== currentVersion) {
                const message = hasCredentials
                    ? `Datadog Observability v${currentVersion} is ready! 65+ monitoring tools available in Copilot Chat.`
                    : 'Datadog Observability installed! Configure your API credentials when you\'re ready — just use Cmd+Shift+P → "Configure Datadog Credentials".';
                vscode.window.showInformationMessage(
                    message,
                    hasCredentials ? 'View Documentation' : 'Configure Now',
                    'Got it'
                ).then(selection => {
                    if (selection === 'Configure Now') {
                        vscode.commands.executeCommand('datadogObservability.configure');
                    } else if (selection === 'View Documentation') {
                        vscode.commands.executeCommand('datadogObservability.viewDocs');
                    }
                });
                context.globalState.update('welcomeShownForVersion', currentVersion);
            }
        }
    })();

    // Command: Configure Datadog Credentials
    const configureCmd = vscode.commands.registerCommand('datadogObservability.configure', async () => {
        log('Command: Configure Datadog Credentials');

        const apiKey = await vscode.window.showInputBox({
            prompt: 'Enter your Datadog API Key',
            password: true,
            placeHolder: 'Your Datadog API Key',
            ignoreFocusOut: true,
        });

        if (apiKey === undefined) { return; }

        const appKey = await vscode.window.showInputBox({
            prompt: 'Enter your Datadog Application Key',
            password: true,
            placeHolder: 'Your Datadog Application Key',
            ignoreFocusOut: true,
        });

        if (appKey === undefined) { return; }

        const siteOptions = [
            'datadoghq.com',
            'us3.datadoghq.com',
            'us5.datadoghq.com',
            'datadoghq.eu',
            'ap1.datadoghq.com',
            'ddog-gov.com',
        ];

        const site = await vscode.window.showQuickPick(siteOptions, {
            placeHolder: 'Select your Datadog site',
            title: 'Datadog Site',
        });

        if (site === undefined) { return; }

        // Save credentials
        await context.secrets.store('datadogObservability.apiKey', apiKey);
        await context.secrets.store('datadogObservability.appKey', appKey);
        await vscode.workspace.getConfiguration('datadogObservability').update('site', site, vscode.ConfigurationTarget.Global);

        log(`Credentials saved. Site: ${site}`);
        updateStatusBar(true);

        // Test connection
        const testNow = await vscode.window.showInformationMessage(
            'Credentials saved! Would you like to test the connection?',
            'Test Connection',
            'Skip'
        );

        if (testNow === 'Test Connection') {
            vscode.commands.executeCommand('datadogObservability.testConnection');
        } else {
            vscode.window.showInformationMessage(
                'Credentials saved. Reload VS Code to apply changes.',
                'Reload'
            ).then(sel => {
                if (sel === 'Reload') {
                    vscode.commands.executeCommand('workbench.action.reloadWindow');
                }
            });
        }
    });

    // Command: Test Connection
    const testConnectionCmd = vscode.commands.registerCommand('datadogObservability.testConnection', async () => {
        log('Command: Test Datadog Connection');

        const apiKey = await context.secrets.get('datadogObservability.apiKey');
        const appKey = await context.secrets.get('datadogObservability.appKey');

        if (!apiKey || !appKey) {
            vscode.window.showErrorMessage(
                'Datadog credentials not configured. Please configure them first.',
                'Configure'
            ).then(sel => {
                if (sel === 'Configure') {
                    vscode.commands.executeCommand('datadogObservability.configure');
                }
            });
            return;
        }

        const config = vscode.workspace.getConfiguration('datadogObservability');
        const site = config.get<string>('site', 'datadoghq.com');

        const siteToBaseUrl: Record<string, string> = {
            'datadoghq.com': 'https://api.datadoghq.com',
            'datadoghq.eu': 'https://api.datadoghq.eu',
            'us3.datadoghq.com': 'https://api.us3.datadoghq.com',
            'us5.datadoghq.com': 'https://api.us5.datadoghq.com',
            'ap1.datadoghq.com': 'https://api.ap1.datadoghq.com',
            'ddog-gov.com': 'https://api.ddog-gov.com',
        };

        const baseUrl = siteToBaseUrl[site] || 'https://api.datadoghq.com';

        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Testing Datadog connection...',
                cancellable: false,
            },
            async () => {
                try {
                    const response = await fetch(`${baseUrl}/api/v1/validate`, {
                        method: 'GET',
                        headers: {
                            'DD-API-KEY': apiKey,
                            'DD-APPLICATION-KEY': appKey,
                            'Content-Type': 'application/json',
                        },
                    });

                    if (response.ok) {
                        log('Connection test successful');
                        updateStatusBar(true);
                        vscode.window.showInformationMessage(
                            '✅ Datadog connection successful! Your credentials are valid.'
                        );
                    } else if (response.status === 401) {
                        log('Connection test failed: Invalid API Key', 'error');
                        updateStatusBar(false);
                        vscode.window.showErrorMessage('❌ Invalid API Key. Please check your credentials.');
                    } else if (response.status === 403) {
                        log('Connection test failed: Invalid Application Key', 'error');
                        updateStatusBar(false);
                        vscode.window.showErrorMessage('❌ Invalid Application Key or insufficient permissions.');
                    } else {
                        log(`Connection test failed: HTTP ${response.status}`, 'error');
                        updateStatusBar(false);
                        vscode.window.showErrorMessage(`❌ Connection failed with status ${response.status}`);
                    }
                } catch (error) {
                    const msg = error instanceof Error ? error.message : String(error);
                    log(`Connection test error: ${msg}`, 'error');
                    updateStatusBar(false);
                    vscode.window.showErrorMessage(`❌ Connection error: ${msg}`);
                }
            }
        );
    });

    // Command: Restart MCP Server
    const restartCmd = vscode.commands.registerCommand('datadogObservability.restart', () => {
        log('Command: Restart Datadog MCP Server');
        vscode.window.showInformationMessage(
            'Restarting Datadog MCP Server... Please reload VS Code.',
        );
        vscode.commands.executeCommand('workbench.action.reloadWindow');
    });

    // Command: View Documentation
    const viewDocsCmd = vscode.commands.registerCommand('datadogObservability.viewDocs', () => {
        vscode.env.openExternal(vscode.Uri.parse('https://github.com/GleidsonFerSanP/datadog-mcp#readme'));
    });

    context.subscriptions.push(configureCmd, testConnectionCmd, restartCmd, viewDocsCmd);

    log('Datadog Observability extension activated successfully');
    log(`MCP Available: ${mcpAvailable}`);
}

export function deactivate() {
    log('Datadog Observability extension deactivated');
}
