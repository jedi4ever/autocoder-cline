#Extensions Management
#  --extensions-dir <dir>              Set the root path for extensions.
#  --list-extensions                   List the installed extensions.
#  --show-versions                     Show versions of installed extensions, when using --list-extensions.
#  --category <category>               Filters installed extensions by provided category, when using --list-extensions.
#  --install-extension <ext-id | path> Installs or updates an extension. The argument is either an extension id or a path to
#                                      a VSIX. The identifier of an extension is '${publisher}.${name}'. Use '--force'
#                                      argument to update to latest version. To install a specific version provide
#                                      '@${version}'. For example: 'vscode.csharp@1.2.3'.
#  --pre-release                       Installs the pre-release version of the extension, when using --install-extension
#  --uninstall-extension <ext-id>      Uninstalls an extension.
#  --update-extensions                 Update the installed extensions.
#  --enable-proposed-api <ext-id>      Enables proposed API features for extensions. Can receive one or more extension IDs to
#                                      enable individually.

PACKAGE_ID="saoudrizwan.claude-dev"


code --list-extensions | grep -i ${PACKAGE_ID}
code --uninstall-extension ${PACKAGE_ID}

code  -v debug --install-extension  vsix/claude-dev-darwin-arm64.vsix

echo "needs a reload"