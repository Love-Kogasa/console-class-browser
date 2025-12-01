const {Writable} = require("stream")
const {format, inspect} = require("util")

class BrowserStdout extends Writable {
  clear = console.clear
  _write(chunk, encoding, callback) {
    console.log(Buffer.from(chunk, encoding).toString().slice(0, -1))
    callback()
  }
}

class BrowserStderr extends Writable {
  _write(chunk, encoding, callback) {
    console.error(Buffer.from(chunk, encoding).toString().slice(0, -1))
    callback()
  }
}

const simpleLogList = [
  "Linfo", "Lwarn", "Ltable", "Ldirxml", "Ldebug", "GgroupCollapsed", "NcreateTask"
]

const symbolTable = {
  "L": "log", "E": "error", "G": "group", "N": "empty"
}

const native = [
  "profile", "profileEnd", "timeStamp"
]

function Console(stdout = {}, stderr) {
  this.label = {time: {}, count: {}}
  if(!(typeof stdout.write === "function")) {
    this.inspectOption = stdout.inspectOptions || {}
    this.indentNumber = stdout.groupIndentation || 2
    this.indent = 0
    this.stdout = stdout.stdout || new BrowserStdout()
    this.stderr = (stdout.stderr || stdout.stdout) || new BrowserStderr()
  } else {
    this.stdout = stdout || new BrowserStdout()
    this.stderr = (stderr || stdout) || new BrowserStdout()
  }
  for(let func of native)
    this[func] = console[func]
  for(let func of simpleLogList) {
    this[func.slice(1)] = this[symbolTable[func[0]]]
  }
}
Console.prototype = {
  _log(...text) {
    var needFormat = true
    text = text.map(inspectAll)
    var output = needFormat ? format(...text) : text.join(" ")
    output = output.split("\n").
      map(line => line.padStart(line.length + this.indent, " "))
      .join("\n")
    return output + "\n"
    function inspectAll(value) {
      if(typeof value !== "string") {
        needFormat && (needFormat = false)
        return inspect(value)
      } else return value
    }
  },
  log(...text) {
    this.stdout.write(this._log(...text))
  },
  error(...text) {
    this.stderr.write(this._log(...text))
  },
  trace(...text) {
    var trace = new Error()
    trace.name = "Trace"
    trace.message = this._log(...text)
    this.error(trace)
  },
  empty() {},
  assert(value, ...message) {
    if(value) this.error(...message)
  },
  clear() {
    return (this.stdout.clear || (() => void 0))()
  },
  dir(obj, option) {
    this.log(inspect(obj, {...this.inspectOption, ...option}))
  },
  count(label="default") {
    this.label.count[label] = (this.label.count[label] || 0) + 1
    this.log(label + ": " + this.label.count[label])
  },
  countReset(label="default") {
    if(!this.label.count[label]) throw "Counter \"" + label + "\" doesn’t exist."
    this.label.count[label] = -1
    this.count(label)
  },
  time(label="default") {
    this.label.time[label] = performance.now()
  },
  timeLog(label="default") {
    this.log(label + ": " + ((performance.now() - this.label.time[label]) / 1000).toFixed(3) + "s")
  },
  timeEnd(label="default") {
    this.timeLog(label)
    delete this.label.time[label]
  },
  group(...text) {
    this.log(...text)
    this.indent += this.indentNumber
  },
  groupEnd() {
    this.indent -= this.indentNumber
  }
}
Console.prototype.Console = Console

const basicConsole = new Console()
Object.assign(basicConsole, {BrowserStdout, BrowserStderr})
module.exports = basicConsole