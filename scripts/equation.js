class Equation {
    #origin;
    #buffer = [];
    #operator = [];
    #equationTable = {};
    
    /**
     * @param {string} str 
     */
    constructor(str = "") {
        this.#origin = str.replaceAll(" ", "");
        const result = this.#parse();
        this.#buffer = result[0];
        this.#operator = result[1];
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
            case "-": case "+": return 1;
            case "*": case "/": return 2;
            case "^": return 3;
        }
        return 0;
    }
    
    #parsePow(data) {
        let isNumber = true;
        let key = "";

        const resultOperator = [];
        const resultValues = [];
        const operator = [];
        const values = [];

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
            if(value != "") values.push(typeParse());

            isNumber = true;
            key = "";
        }

        const operatorPush = op => {
            if(lastOperatorLevel() == 0)
                return operator.push(op);

            const currentLevel = this.#getOperatorLevel(op);
            if(lastOperatorLevel() <= currentLevel)
                return operator.push(op);

            while(operator.length > 0) {
                if(lastOperatorLevel() <= currentLevel) break;
                resultOperator.push(operator.pop());
                resultValues.push(values.pop());
            }
            resultValues.push(values.pop());
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
                    key = [key == "" ? undefined : typeParse(key), this.#parse(data)];
                    continue;
                case ')': continue;
                case '*': case '/':
                    valuePush();
                    operatorPush(c);
                    continue;
                case "^": case "+": case "-":
                    data["index"]--;
                    break A;
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

        while(operator.length > 0) {
            resultOperator.push(operator.pop());
            resultValues.push(values.pop());
        }
        resultValues.push(values.pop());

        return [resultValues, resultOperator];
    }

    #parse(data = {}) {
        let isNumber = true;
        let key = "";
        let pass = false;

        const resultOperator = [];
        const resultValues = [];
        const operator = [];
        const values = [];

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
            if(value != "") values.push(typeParse());

            isNumber = true;
            key = "";
            pass = false;
        }

        const operatorPush = op => {
            if(lastOperatorLevel() == 0)
                return operator.push(op);

            const currentLevel = this.#getOperatorLevel(op);
            if(lastOperatorLevel() <= currentLevel)
                return operator.push(op);

            while(operator.length > 0) {
                if(lastOperatorLevel() <= currentLevel) break;
                resultOperator.push(operator.pop());
                resultValues.push(values.pop());
            }
            resultValues.push(values.pop());
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
                    key = [key == "" ? undefined : typeParse(key), this.#parse(data)];
                    continue;
                case ')':
                    break A;
                case "^":
                    key = [1, typeParse(key), this.#parsePow(data)];
                    continue;
                case '*': case '/':
                    valuePush();
                    operatorPush(c);
                    continue;
                case "+": case "-":
                    if(key == "") break;
                    valuePush();
                    operatorPush(c);
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

        while(operator.length > 0) {
            resultOperator.push(operator.pop());
            resultValues.push(values.pop());
        }
        resultValues.push(values.pop());

        return [resultValues, resultOperator];
    }
    
    #removeFirstStr(str) {
        return str.substr(1);
    }
    
    #removeLastStr(str) {
        return str.substr(0, str.length - 1);
    }
    
    #calcLoop(funcCall, x) {
        if(!Array.isArray(funcCall)) return funcCall;
        if(funcCall.length == 3) {
            //□^□  format
            const a = Array.isArray(funcCall[1])
                ? this.calc(x, funcCall[1][0], funcCall[1][1])
                : this.#inputCheck(funcCall[1], x);
            const b = Array.isArray(funcCall[2])
                ? this.calc(x, funcCall[2][0], funcCall[2][1])
                : this.#inputCheck(funcCall[2], x);
            return Math.pow(a, b);
        }
        const result = this.calc(x, funcCall[1][0], funcCall[1][1]);
        if(funcCall[0] == undefined)
            return result;
        if(typeof funcCall[0] != "string") return funcCall[0] * result;
        const direction = funcCall[0].startsWith("-") ? -1 : 1;
        if(funcCall[0][0] == "-" || funcCall[0][0] == "+")
            funcCall[0] = this.#removeFirstStr(funcCall[0]);
        
        return direction * this.#special(funcCall[0], result, x);
    }
    
    #inputCheck(data, x) {
        if(typeof data == "number") return data;
        const direction = data.startsWith("-") ? -1 : 1;
        if(["-","+"].includes(data[0]))
            data = this.#removeFirstStr(data);
        
        data = data.toLowerCase();
        if(data.endsWith("x")) {
            data = this.#removeLastStr(data);
            const multi = x;
            if(data == "") return direction * multi;
            return direction * this.#special(data, multi, x);
        }
        
        return direction * this.#special(data, 1, x);
    }
    
    #valueSpecial(data) {
        switch(data) {
            case "e": return Math.E;
            case "pi": return Math.PI;
            case "ln": return Math.log;
        }
        
        if(!data.startsWith("log")) return undefined;
        data = data.substr(3);
        const low = this.#inputCheck(data);
        return data => Math.log(data) / Math.log(low);
    }
    
    #special(data, value = 1, x = 0) {
        data = data.toLowerCase();
        if(Math.hasOwnProperty(data)) {
            if(typeof value != "object") value = [value];
            return Math[data].apply(this, value);
        }
        if(data in this.#equationTable) {
            return this.#equationTable[data].calc(value);
        }
        if(Array.isArray(value)) value = value[0];
        const result = this.#valueSpecial(data);
        if(result != undefined) {
            if(typeof result == "function")
              return result.apply(this, [value]);
            return  result * value;
        }
        
        if(data.endsWith("x")) {
            data = this.#removeLastStr(data);
            if(data == "") return x * value;
            return this.#special(data, x * value, x);
        }
        return parseFloat(data);
    }

    /**
     * @param {number} x 
     */
    calc(x, buffer = this.#buffer, operator = this.#operator) {
        if(this.#origin == "") return NaN;
        if(buffer.lenth == 1) {
          return this.#inputCheck(this.#calcLoop(buffer[0], x), x);
        }
        
        let num2 = this.#inputCheck(this.#calcLoop(buffer[0], x), x);
        
        for(let i = 0; i < operator.length; i++) {
            let num1 = this.#inputCheck(this.#calcLoop(buffer[i + 1], x), x);
            switch(operator[i]) {
                case "/":
                    num2 = num1 / num2;
                    break;
                case "*":
                    num2 = num1 * num2;
                    break;
                case "+":
                    num2 = num1 + num2;
                    break;
                case "-":
                    num2 = num1 - num2;
                    break;
            }
        }
        return num2;
    }
    
    get origin() {
        return this.#origin;
    }
}