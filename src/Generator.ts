import * as vsc from 'vscode';

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
  varDef: /([a-zA-Z_$][0-9a-zA-Z_$]*)[\s]?\:[\s]?([\.\<\>\{\}\[\]a-zA-Z_$\s<>,]+)/
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
      const matches = line.text.match(matchers.varDef);
      if (bracketClass && matches) {
        // push the found variables into the approriate containers
        bracketClass.vars.push({
          name: matches[1],
          figure: matches[1],
          typeName: matches[2]
        });

      }
      if (line.text.indexOf('{') !== -1) {
        brackets.open++;
      }
      if (line.text.indexOf('}') !== -1) {
        brackets.closed++;
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

          if (currentPos.isBefore(bracketClass.startPos) || currentPos.isAfter(bracketClass.endPos)) {
            bracketClass.vars = [];
          }
        }
        // done analyzing a class, up to the next
      }
    }
  }
  return classes;
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
        printLog(`class;: ${_class.name}, start: ${_class.startPos.line}; end: ${_class.endPos?.line}, hasConstructor: ${_class.hasConstructor}; vars: ${_class.vars.length}`)
        if (currentPos.line >= _class.startPos.line && (end && currentPos.line <= end.line)) {
          if (_class.hasConstructor) {
            showInfoMessage('Your class already has a constructor.');
          } else {
            builder.insert(currentPos, createConstructor(classes[i].vars));
          }
          return;
        }
      }
    });
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
  var c = `\n${tab}constructor(${breakLine}`;
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
  c += `\n${tab}}\n`;
  return c;
}

//Create output channel
// let output = vsc.window.createOutputChannel("Constructor Generator");
function printLog(s: string) {
  // output.appendLine(s);
}

export function showInfoMessage(message: string) {
	vsc.window.showInformationMessage(
		message,
		{ title: "OK" }
	);
}