const {Writable} = require("stream")
const {format, inspect} = require("util")

class BrowserStdout extends Writable {
  clear = console.clear
  _write(chunk, encoding, callback) {
    console.log(Buffer.from(chunk, encoding).toString().trim())
    callback()
  }
}

class BrowserStderr extends Writable {
  _write(chunk, encoding, callback) {
    console.error(Buffer.from(chunk, encoding).toString().trim())
    callback()
  }
}

const simpleLogList = [
  "Linfo", "Lwarn", "Ltable", "Ngroup", "NgroupEnd", "NgroupCollapsed", "Ldirxml", "Etrace", "Nprofile", "NprofileEnd", "NtimeStamp", "Ldebug"
]

const symbolTable = {
  "L": "log", "E": "error", "N": "empty"
}

function Console(stdoutOrOption = {}, stderr) {
  this.label = {time: {}, count: {}}
  if(!(typeof stdoutOrOption.write === "function")) {
    this.inspectOption = stdoutOrOption.inspectOptions || {}
    this.stdout = stdoutOrOption.stdout || new BrowserStdout()
    this.stderr = (stdoutOrOption.stderr || stdoutOrOption.stdout) || new BrowserStderr()
  } else {
    this.stdout = stdoutOrOption || new BrowserStdout()
    this.stderr = (stderr || stdoutOrOption) || new BrowserStdout()
  }
  for(let func of simpleLogList) {
    this[func.slice(1)] = this[symbolTable[func[0]]]
  }
}
Console.prototype = {
  log(...text) {
    this.stdout.write(format(...text) + "\n")
  },
  error(...text) {
    this.stderr.write(format(...text) + "\n")
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
  }
}
Console.prototype.Console = Console

const basicConsole = new Console()
Object.assign(basicConsole, {BrowserStdout, BrowserStderr})
module.exports = basicConsole