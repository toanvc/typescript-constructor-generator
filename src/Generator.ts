import * as vsc from 'vscode';

const LOG = false;

interface IVar {
  name: string;
  figure: string;
  typeName: string;
}

interface IClass {
  name: string
  startPos: vsc.Position
  endPos?: vsc.Position
  vars: IVar[]
  getters: string[]
  setters: string[],
  hasConstructor: boolean
}

const matchers = {
  className: /class\s([a-zA-Z0-9]+)/,
  varDef: /([a-zA-Z_$#][0-9a-zA-Z_$?]*)[\s]?\:[\s]?([\.\<\>\{\}\[\]a-zA-Z_$\s<>,]+)/
};

/* Export functions */

// scan the current active text window and construct an IClass array
export function generateClassesList(): IClass[] {
  let classes: IClass[] = [];
  let brackets = {
    name: '',
    within: false,
    open: 0,
    closed: 0,
    hasConstructor: false
  };
  const currentPos = vsc.window.activeTextEditor?.selection.active;
  const lineCount = vsc.window.activeTextEditor?.document.lineCount ?? 0;
  if (!vsc.window.activeTextEditor || !currentPos) {
    return [];
  }
  for (let i = 0; i < lineCount; i++) {
    const line = vsc.window.activeTextEditor.document.lineAt(i);
    // check if we are outside a class (brackets) and a new class definition pops-up
    // when it does we are now within a class def and we can start checking for private variables
    if (!brackets.within && line.text.indexOf('class') !== -1) {
      brackets.within = true;
      let matches = line.text.match(matchers.className);
      if (matches) {
        brackets.name = matches[1];
      }
      brackets.open = 0;
      brackets.closed = 0;
      brackets.hasConstructor = false;
      classes.push({
        name: brackets.name,
        startPos: new vsc.Position(i, 0),
        vars: [],
        getters: [],
        setters: [],
        hasConstructor: false
      });
    }
    // within brackets start matching each line for a private variable
    // and add them to the corresponding IClass
    if (brackets.within) {
      let bracketClass = getClass(classes, brackets.name);
      if (line.text.indexOf('{') !== -1) {
        brackets.open++;
      }
      if (line.text.indexOf('}') !== -1) {
        brackets.closed++;
      }

      // Only add variables of class, ignore function's variables
      if (brackets.closed + 1 === brackets.open) {
        const matches = line.text.match(matchers.varDef);
        if (bracketClass && matches) {
          if (!checkAssignedVar(line)) {
            // push the found variables into the approriate containers
            var name = matches[1];
            if (name.endsWith('?')) {
              name = name.slice(0, -1);
            }
            var figure = name;
            if (figure.startsWith('#') || figure.startsWith('_')) {
              figure = figure.slice(1);
            }
            const colonIndex = line.text.indexOf(':');
            var typeName = line.text.substring(colonIndex + 1).trim();

            bracketClass.vars.push({
              name: name,
              figure: figure,
              typeName: typeName
            });
          }
        }
      }

      if (line.text.indexOf('constructor') !== -1) {
        brackets.hasConstructor = true;
      }

      // if the brackets match up we are (maybe) leaving a class definition
      if (brackets.closed !== 0 && brackets.open !== 0 && brackets.closed === brackets.open) {
        brackets.within = false;
        if (bracketClass) {
          bracketClass.endPos = new vsc.Position(i, 0);
          bracketClass.hasConstructor = brackets.hasConstructor;
        }
        // done analyzing a class, up to the next
      }
    }
  }
  return classes;
}

function checkAssignedVar(textLine: vsc.TextLine): boolean {
  return textLine.text.indexOf('=') >= 0 && textLine.text.indexOf('=>') < 0;
}

// generate code lines into the current active window based on EType
export function generateCode(classes: IClass[]) {
  if (!vsc.window.activeTextEditor) {
    return;
  }
  const currentPos = new vsc.Position(vsc.window.activeTextEditor.selection.active.line, 0);

  try {
    vsc.window.activeTextEditor?.edit((builder) => {
      for (let i = 0; i < classes.length; i++) {
        const _class = classes[i];
        const end = _class.endPos;
        printLog(`class;: ${_class.name}, start: ${_class.startPos.line}; end: ${_class.endPos?.line}, hasConstructor: ${_class.hasConstructor}; vars: ${_class.vars.length}`);
        if (currentPos.line >= _class.startPos.line && (end && currentPos.line <= end.line || !end)) {
          builder.insert(currentPos, createConstructor(classes[i].vars));
          return;
        }
      }
    });
    formatCode();
  } catch (error) {
    printLog(`error ${error}`);
  }
}

/* Helper functions */

function getClass(items: IClass[], name: string): IClass | null {
  for (let i = 0; i < items.length; i++) {
    if (items[i].name === name) {
      return items[i];
    }
  }
  return null;
}

function createConstructor(items: IVar[]) {
  var breakLine = '';
  var breaking = false;
  const tab = '  ';
  if (items.length > 3) {
    breakLine = '\n';
    breaking = true;
  }
  var c = `${tab}constructor(${breakLine}`;
  var b = false;
  for (let i = 0; i < items.length; i++) {

    if (b) {
      c += `, ${breakLine}`;
    }
    if (breaking) {
      c += `${tab}${tab}`;
    }
    c += items[i].figure + ': ' + items[i].typeName;
    if (!b) {
      b = true;
    }
  }
  c += `${breakLine}) {`;
  b = false;
  for (let i = 0; i < items.length; i++) {
    c += `\n${tab}${tab}this.` + items[i].name + ' = ' + items[i].figure;
  }
  c += `\n${tab}}`;
  return c;
}

var output: vsc.OutputChannel | null;
if (LOG) {
  //Create output channel
  output = vsc.window.createOutputChannel("Constructor Generator");
}

function printLog(s: string) {
  output?.appendLine(s);
}

function formatCode() {
  vsc.commands.executeCommand('editor.action.formatDocument');
}

export function showInfoMessage(message: string) {
  vsc.window.showInformationMessage(
    message,
    { title: "OK" }
  );
}