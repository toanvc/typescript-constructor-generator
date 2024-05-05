This is inspired by [vscode-gengetset](https://github.com/cybertim/vscode-gengetset). I simplify it with only constructor generator and modify it with my purpose. Also I fixed the issue when the extension command can not work for multiple classes in one file. Since that project isn't maintained and out of date, I'm creating this to support my current need.

# Auto generate Constructor
You now can use to generate the constructor with many variables in a class. It supports both one class per file or multiple classes per file. 

## Changelog

### v1.0.0
* Fix issues <br>
#1: semicolon is considered as part of the attribute type
 

### v0.2.0
* Fix issues <br>
#1: Doesn't generate type properly when using lookup type <br>
#2: ignore annotation arguments<br>
#4: Issue with variable started by #<br>
* Support more types of variables
* Generating constructor without checking existing constructor in class

### v0.1.0
+ First version: Supporting only Generate Constructor command.
With 3 variables or less, the constructor has single line for inputs.
With 4 or more, the constructor will have single line for each variable.


![constructor](demo.gif)

## Install
Get VSCode and grab the extension from the [VSCode Extension Market](https://marketplace.visualstudio.com/items?itemName=toanchivu.tcv-typescript-constructor-generator)

## Usage

1. Just place your cursor within a TypeScript class definition in the text editor window
2. Open the command palette `ctrl+shift+P` / `cmd+shift+P`.
3. Search for 'Generate Constructor'

or

1. Just place your cursor within a TypeScript class definition in the text editor window
2. Press `alt+shift+G` for a quick selection pop-up
3. Select the preferred function from the pop-up menu

or

1. Click on the little Eye-Icon in your statusbar
2. Select the preferred function from the pop-up menu

The generated method will be placed at the cursors position.

**Enjoy!**
