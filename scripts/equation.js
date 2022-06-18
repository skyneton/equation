class Equation {
    #origin;
    #buffer = [];
    #equationTable = {};
    
    /**
     * @param {string} str 
     */
    constructor(str = "") {
        this.#origin = str.replaceAll(" ", "").toLowerCase();
        const result = this.#parse();
        this.#buffer = result;
    }
    
    /**
     * @param {object} equationTable
     **/
    setEquationTable(equationTable) {
        if(typeof equationTable != "object") return;
        this.#equationTable = equationTable;
    }
    
    #getOperatorLevel(operator) {
        switch(operator) {
            case ">": case "<": return 1
            case "-": case "+": return 2;
            case "*": case "/": return 3;
            case "^": return 4;
        }
        return 0;
    }
    
    #parseArray(data = {}, res = undefined, oper = undefined) {
        let isNumber = true;
        let key = "";

        const result = [];
        const operator = [];
        
        let index = 0;
        if(res) {
            result[index] = res;
            operator[index] = oper;
            index++;
        }
        const getLastOperator = (n = 1) => operator[index].length <= n - 1 ? "" : operator[index][operator[index].length - n];
        
        const lastOperatorLevel = (n = 1) => {
            const op = getLastOperator(n);
            return op ? this.#getOperatorLevel(op) : 0;
        };

        const typeParse = (value = key) => {
            if(typeof value != "string" || value == "") return value;
            if(!isNumber || isNaN(value)) return value;
            return parseFloat(value);
        }
        
        const valuePush = (value = key) => {
            result[index] ??= [];
            if(value != "") result[index].push(typeParse());

            isNumber = true;
            key = "";
        }
        
        const operatorPush = op => {
            operator[index] ??= [];
            if(lastOperatorLevel() == 0)
                return operator[index].push(op);

            const currentLevel = this.#getOperatorLevel(op);
            if(lastOperatorLevel() <= currentLevel)
                return operator[index].push(op);
                
            while(operator[index].length > 0) {
                if(lastOperatorLevel() < currentLevel) break;
                result[index].push(operator[index].pop());
            }
            operator[index].push(op);
        }

        const length = this.#origin.length;
        A: for(++data["index"]; data["index"] < length; data["index"]++) {
            const i = data["index"];
            const c = this.#origin[i];
            switch(c) {
                case '(':
                    key = [1, key == "" ? undefined : typeParse(key), this.#parse(data)];
                    continue;
                case ')': break A;
                case '>': case '<': case '%': case '^': case '*': case '/':
                    valuePush();
                    operatorPush(c);
                    continue;
                case "+": case "-":
                    if(key == "") key = "0";
                    valuePush();
                    operatorPush(c);
                    continue;
                case ',':
                    valuePush();
                    index++;
                    continue;
            }
            if(Array.isArray(key)) {
                key[0] ??= "";
                key[0] += c;
            }else
                key += c;
            if(!(c >= '0' && c <= '9'  || (c == "." || c == "+" || c == "-")))
                isNumber = false;
        }

        valuePush();
        
        for(let i = 0; i <= index; i++) {
          result[i] ??= [];
          operator[i] ??= [];
          while(operator[i].length > 0) {
              result[i].push(operator[i].pop());
          }
        }

        return result;
    }

    #parse(data = {}) {
        let isNumber = true;
        let key = "";
        let pass = false;

        const result = [];
        const operator = [];

        const getLastOperator = (n = 1) => operator.length <= n - 1 ? "" : operator[operator.length - n];
        
        const lastOperatorLevel = (n = 1) => {
            const op = getLastOperator(n);
            return op ? this.#getOperatorLevel(op) : 0;
        };

        const typeParse = (value = key) => {
            if(typeof value != "string" || value == "") return value;
            if(!isNumber || isNaN(value)) return value;
            return parseFloat(value);
        }
        
        const valuePush = (value = key) => {
            if(value != "") result.push(typeParse());

            isNumber = true;
            key = "";
            pass = false;
        }

        const operatorPush = op => {
            if(lastOperatorLevel() == 0)
                return operator.push(op);

            const currentLevel = this.#getOperatorLevel(op);
            if(lastOperatorLevel() < currentLevel)
                return operator.push(op);

            while(operator.length > 0) {
                if(lastOperatorLevel() < currentLevel) break;
                result.push(operator.pop());
                //resultValues.push(values.pop());
            }
            //resultValues.push(values.pop());
            operator.push(op);
        }

        if(!("index" in data))
            data["index"] = -1;
        const length = this.#origin.length;
        A: for(++data["index"]; data["index"] < length; data["index"]++) {
            const index = data["index"];
            const c = this.#origin[index];
            switch(c) {
                case '(':
                    key = [1, key == "" ? undefined : typeParse(key), ...this.#parse(data)];
                    continue;
                case ')':
                    break A;
                case ',':
                    valuePush();
                    return [[2, ...this.#parseArray(data, result, operator)]];
                case '>': case '<': case '^': case '%': case '*': case '/':
                    valuePush();
                    operatorPush(c);
                    continue;
                case "+": case "-":
                    if(key == "") key = "0";
                    valuePush();
                    operatorPush(c);
                    continue;
            }
            if(Array.isArray(key)) {
                key[0] ??= "";
                key[0] += c;
            }else
                key += c;
            if(!(c >= '0' && c <= '9'  || (c == ".")))
                isNumber = false;
        }
        
        valuePush();

        while(operator.length > 0) {
            result.push(operator.pop());
            //resultValues.push(values.pop());
        }
        //resultValues.push(values.pop());

        return result;
    }
    
    #removeFirstStr(str) {
        return str.substr(1);
    }
    
    #removeLastStr(str) {
        return str.substr(0, str.length - 1);
    }
    
    #normalize(data, x) {
        if(!isNaN(data)) return parseFloat(data);
        const direction = data.startsWith("-") ? -1 : 1;
        if(data[0] == '-' || data[0] == '+') data = data.substr(1);
        
        if(data.endsWith("x")) {
            data = data.substr(0, data.length - 1);
            if(data == "") return direction * x;
            return direction * this.#special(data, x, x);
        }
        
        return direction * this.#special(data, 1, x);
    }
    
    cot(x) {
        return 1 / Math.tan(x);
    }
    
    csc(x) {
        return 1 / Math.sin(x);
    }
    
    sec(x) {
        return 1 / Math.cos(x);
    }
    
    mod(x, y) {
        return x % y;
    }
    
    #valueSpecial(data, x) {
        switch(data) {
            case "e": return Math.E;
            case "pi": return Math.PI;
            case "ln": return Math.log;
            case "cot": return this.cot;
            case "csc": return this.csc;
            case "sec": return this.sec;
            case "mod": return this.mod;
        }
        
        if(!data.startsWith("log")) return undefined;
        data = data.substr(3);
        const low = isNaN(data) ? this.#normalize(data, x) : parseFloat(data);
        return a => Math.log(a) / Math.log(low);
    }
    
    #special(data, value = 1, x = 0) {
        if(typeof value != "object") value = [value];
        if(Math.hasOwnProperty(data)) {
            return Math[data].apply(this, value);
        }
        if(data in this.#equationTable) {
            return this.#equationTable[data].calc(value);
        }
        const result = this.#valueSpecial(data, x);
        if(result != undefined) {
            if(typeof result == "function") return result.apply(this, value);
            return  result * value[0];
        }
        if(Array.isArray(value)) value = value[0];
        
        if(data.endsWith("x")) {
            data = data.substr(0, data.length- 1);
            if(data == "") return x * value;
            return this.#special(data, x * value, x);
        }
        return parseFloat(data) * value;
    }

    /**
     * @param {number} x 
     */
    calc(x, buffer = this.#buffer) {
        const result = [];
        let a, b;
        for(const data of buffer) {
            switch(data) {
                case '+':
                    result.push(result.pop() + result.pop());
                    break;
                case '-':
                    b = result.pop(), a = result.pop();
                    result.push(a - b);
                    break;
                case '*':
                    result.push(result.pop() * result.pop());
                    break;
                case '/':
                    b = result.pop(), a = result.pop();
                    result.push(a / b);
                    break;
                case '%':
                    b = result.pop(), a = result.pop();
                    result.push(a % b);
                    break;
                case '^':
                    b = result.pop(), a = result.pop();
                    result.push(Math.pow(a, b));
                    break;
                case '>':
                    b = result.pop(), a = result.pop();
                    result.push(a > b);
                    break;
                case '<':
                    b = result.pop(), a = result.pop();
                    result.push(a < b);
                    break;
                default:
                    result.push(this.#calc(data, x));
            }
        }
        return result.length == 0 ? NaN : result[0];
    }
    
    #calc(data, x) {
        if(typeof data == "string") return this.#normalize(data, x);
        if(typeof data == "number") return data;
        if(!Array.isArray(data)) return NaN;
        const arr = [];
        switch(data[0]) {
            case 1:
                for(let i = 2; i < data.length; i++) arr.push(data[i]);
                const calc = this.calc(x, arr);
                if(data[1] == undefined) return calc;
                if(Array.isArray(data[1])) return this.calc(x, [data[1]]) * calc;

                const direction = data[1][0] == '-' ? -1 : 1;
                let func = data[1];
                if(func[0] == '-' || func[0] == '+') func =  func.substr(1);
                if(func == "") return direction * calc;
                return direction * this.#special(func, calc, x);
            case 2:
                for(let i = 1; i < data.length; i++) arr.push(this.calc(x, data[i]));
                return arr;
        }
        return NaN;
    }
    
    get origin() {
        return this.#origin;
    }
}