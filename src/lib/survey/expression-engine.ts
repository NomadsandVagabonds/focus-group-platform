// Expression Engine for Survey Logic
// Evaluates LimeSurvey-style expressions: {Q1_SQ006.NAOK == 'A1' OR Q1_SQ006.NAOK == 'A2'}
// Supports arithmetic, functions, and complex logic

type ResponseValue = string | number | boolean | null | undefined;
type FunctionHandler = (args: ResponseValue[]) => ResponseValue;

export class ExpressionEngine {
    private responseData: Map<string, ResponseValue>;
    private builtinFunctions: Map<string, FunctionHandler>;

    constructor(responseData: Map<string, ResponseValue> = new Map()) {
        this.responseData = responseData;
        this.builtinFunctions = this.initBuiltinFunctions();
    }

    /**
     * Initialize built-in expression functions (LimeSurvey parity)
     */
    private initBuiltinFunctions(): Map<string, FunctionHandler> {
        const funcs = new Map<string, FunctionHandler>();

        // Type checking functions
        funcs.set('is_empty', (args) => {
            const val = args[0];
            return val === undefined || val === null || val === '' ||
                   (Array.isArray(val) && val.length === 0);
        });

        funcs.set('is_numeric', (args) => {
            const val = args[0];
            if (typeof val === 'number') return true;
            if (typeof val === 'string') return !isNaN(parseFloat(val)) && isFinite(Number(val));
            return false;
        });

        funcs.set('is_null', (args) => args[0] === null || args[0] === undefined);
        funcs.set('is_nan', (args) => typeof args[0] === 'number' && isNaN(args[0]));
        funcs.set('is_int', (args) => Number.isInteger(Number(args[0])));
        funcs.set('is_float', (args) => typeof args[0] === 'number' && !Number.isInteger(args[0]));
        funcs.set('is_string', (args) => typeof args[0] === 'string');

        // Type conversion functions
        funcs.set('intval', (args) => parseInt(String(args[0]), 10) || 0);
        funcs.set('floatval', (args) => parseFloat(String(args[0])) || 0);

        // Math functions
        funcs.set('abs', (args) => Math.abs(Number(args[0])));
        funcs.set('ceil', (args) => Math.ceil(Number(args[0])));
        funcs.set('floor', (args) => Math.floor(Number(args[0])));
        funcs.set('round', (args) => {
            const val = Number(args[0]);
            const precision = args[1] !== undefined ? Number(args[1]) : 0;
            const multiplier = Math.pow(10, precision);
            return Math.round(val * multiplier) / multiplier;
        });
        funcs.set('min', (args) => Math.min(...args.map(a => Number(a))));
        funcs.set('max', (args) => Math.max(...args.map(a => Number(a))));
        funcs.set('pow', (args) => Math.pow(Number(args[0]), Number(args[1])));
        funcs.set('sqrt', (args) => Math.sqrt(Number(args[0])));
        funcs.set('exp', (args) => Math.exp(Number(args[0])));
        funcs.set('log', (args) => Math.log(Number(args[0])));
        funcs.set('log10', (args) => Math.log10(Number(args[0])));
        funcs.set('sin', (args) => Math.sin(Number(args[0])));
        funcs.set('cos', (args) => Math.cos(Number(args[0])));
        funcs.set('tan', (args) => Math.tan(Number(args[0])));
        funcs.set('asin', (args) => Math.asin(Number(args[0])));
        funcs.set('acos', (args) => Math.acos(Number(args[0])));
        funcs.set('atan', (args) => Math.atan(Number(args[0])));
        funcs.set('atan2', (args) => Math.atan2(Number(args[0]), Number(args[1])));
        funcs.set('pi', () => Math.PI);
        funcs.set('rand', (args) => {
            if (args.length === 0) return Math.random();
            const min = Number(args[0]) || 0;
            const max = Number(args[1]) || 1;
            return Math.random() * (max - min) + min;
        });

        // String functions
        funcs.set('strlen', (args) => String(args[0] ?? '').length);
        funcs.set('substr', (args) => {
            const str = String(args[0] ?? '');
            const start = Number(args[1]) || 0;
            const length = args[2] !== undefined ? Number(args[2]) : undefined;
            return length !== undefined ? str.substring(start, start + length) : str.substring(start);
        });
        funcs.set('trim', (args) => String(args[0] ?? '').trim());
        funcs.set('ltrim', (args) => String(args[0] ?? '').trimStart());
        funcs.set('rtrim', (args) => String(args[0] ?? '').trimEnd());
        funcs.set('strtoupper', (args) => String(args[0] ?? '').toUpperCase());
        funcs.set('strtolower', (args) => String(args[0] ?? '').toLowerCase());
        funcs.set('ucwords', (args) => {
            return String(args[0] ?? '').replace(/\b\w/g, c => c.toUpperCase());
        });
        funcs.set('str_replace', (args) => {
            const search = String(args[0] ?? '');
            const replace = String(args[1] ?? '');
            const subject = String(args[2] ?? '');
            return subject.split(search).join(replace);
        });
        funcs.set('strrev', (args) => String(args[0] ?? '').split('').reverse().join(''));
        funcs.set('implode', (args) => {
            const separator = String(args[0] ?? ',');
            const arr = args.slice(1);
            return arr.join(separator);
        });
        funcs.set('join', (args) => {
            const separator = String(args[0] ?? ',');
            const arr = args.slice(1);
            return arr.join(separator);
        });

        // Array/aggregate functions
        funcs.set('count', (args) => {
            // Count non-empty values
            return args.filter(v => v !== undefined && v !== null && v !== '').length;
        });
        funcs.set('sum', (args) => {
            return args.reduce((acc: number, v) => {
                const num = Number(v);
                return acc + (isNaN(num) ? 0 : num);
            }, 0);
        });
        funcs.set('avg', (args) => {
            const validNums = args.filter(v => !isNaN(Number(v))).map(v => Number(v));
            if (validNums.length === 0) return 0;
            return validNums.reduce((a, b) => a + b, 0) / validNums.length;
        });
        funcs.set('countif', (args) => {
            // countif(value1, value2, ..., condition)
            // Count how many values match condition
            if (args.length < 2) return 0;
            const condition = args[args.length - 1];
            const values = args.slice(0, -1);
            return values.filter(v => v == condition).length;
        });
        funcs.set('sumif', (args) => {
            // sumif(value1, value2, ..., condition)
            // Sum values that match condition
            if (args.length < 2) return 0;
            const condition = args[args.length - 1];
            const values = args.slice(0, -1);
            return values
                .filter(v => v == condition)
                .reduce((acc: number, v) => acc + Number(v), 0);
        });

        // Control/conditional functions
        funcs.set('if', (args) => {
            const condition = this.toBool(args[0]);
            return condition ? args[1] : (args[2] ?? null);
        });
        funcs.set('iif', (args) => {
            // Alias for if()
            const condition = this.toBool(args[0]);
            return condition ? args[1] : (args[2] ?? null);
        });

        // Number formatting
        funcs.set('number_format', (args) => {
            const num = Number(args[0]);
            const decimals = Number(args[1] ?? 0);
            const decPoint = String(args[2] ?? '.');
            const thousandsSep = String(args[3] ?? ',');

            const fixed = num.toFixed(decimals);
            const [intPart, decPart] = fixed.split('.');
            const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSep);
            return decPart ? formattedInt + decPoint + decPart : formattedInt;
        });

        // Regex matching
        funcs.set('regexMatch', (args) => {
            const pattern = String(args[0] ?? '');
            const str = String(args[1] ?? '');
            try {
                const regex = new RegExp(pattern);
                return regex.test(str);
            } catch {
                return false;
            }
        });

        return funcs;
    }

    /**
     * Evaluate a relevance expression
     * Returns true if the expression evaluates to true, false otherwise
     */
    evaluate(expression: string): boolean {
        if (!expression || expression.trim() === '' || expression === '1') {
            return true; // Empty or '1' means always show
        }

        if (expression === '0') {
            return false; // '0' means never show
        }

        try {
            // Remove outer braces if present
            const cleaned = expression.trim().replace(/^\{/, '').replace(/\}$/, '').trim();

            // Replace variables with values
            const substituted = this.substituteVariables(cleaned);

            // Evaluate the boolean expression
            return this.evaluateBoolean(substituted);
        } catch (error) {
            console.error('Expression evaluation error:', error, 'Expression:', expression);
            return false; // Fail safe - hide question if expression is invalid
        }
    }

    /**
     * Pipe text - replace {Q1.SelectedValue}, {VARNAME}, or {function(args)} with actual values
     * Supports both variable lookups and expression evaluation (including function calls)
     */
    pipe(template: string): string {
        if (!template) return '';

        return template.replace(/\{([^}]+)\}/g, (match, content) => {
            const trimmed = content.trim();

            // Check if this looks like a function call (contains parentheses)
            // or an expression (contains operators like +, -, *, /, ==, etc.)
            const isExpression = /[\(\)\+\-\*\/\%]|==|!=|<=|>=|<|>/.test(trimmed);

            if (isExpression) {
                try {
                    // Evaluate as an expression
                    const result = this.evaluateExpression(trimmed);
                    return result !== undefined && result !== null ? String(result) : match;
                } catch (error) {
                    console.error('Expression piping error:', error, 'Content:', trimmed);
                    return match;
                }
            }

            // Otherwise, treat as a simple variable lookup
            const value = this.getVariableValue(trimmed);
            return value !== undefined && value !== null ? String(value) : match;
        });
    }

    /**
     * Evaluate an expression and return its value (not just boolean)
     * Used for piping expressions like {rand(1,2)} or {Q1 + 10}
     */
    private evaluateExpression(expression: string): ResponseValue {
        try {
            // Substitute variables first
            const substituted = this.substituteVariables(expression);

            // Tokenize and parse
            const tokens = this.tokenize(substituted);
            const ctx = { pos: 0 };

            // Parse as arithmetic expression to get the value
            return this.parseAddSub(tokens, ctx);
        } catch (error) {
            console.error('Expression evaluation error:', error, 'Expression:', expression);
            return undefined;
        }
    }

    /**
     * Substitute variables in expression with their values
     * Matches patterns like: Q1, Q1_SQ006, Q1.NAOK, Q1_SQ006.NAOK, Q1.SelectedValue
     */
    private substituteVariables(expression: string): string {
        // Match variable patterns - alphanumeric with underscores, optionally followed by .suffix
        const variablePattern = /\b([a-zA-Z][a-zA-Z0-9_]*(?:\.[a-zA-Z][a-zA-Z0-9]*)?)\b/g;

        return expression.replace(variablePattern, (match) => {
            // Skip known keywords
            const keywords = ['AND', 'OR', 'NOT', 'true', 'false', 'undefined', 'null'];
            if (keywords.includes(match)) {
                return match;
            }

            const value = this.getVariableValue(match);

            if (value === undefined || value === null) {
                // If variable not found and has .NAOK suffix, return false (Not Applicable OK)
                if (match.endsWith('.NAOK')) {
                    return 'false';
                }
                return 'undefined';
            }

            // Quote string values for safe comparison
            if (typeof value === 'string') {
                return `'${value.replace(/'/g, "\\'")}'`;
            }

            return String(value);
        });
    }

    /**
     * Get variable value from response data
     * Handles formats: Q1, Q1_SQ006, Q1.NAOK, Q1_SQ006.NAOK, Q1.SelectedValue
     */
    private getVariableValue(varName: string): ResponseValue {
        // Remove .NAOK, .SelectedValue, .ChosenValue suffix for lookup
        const suffixPattern = /\.(NAOK|SelectedValue|ChosenValue)$/i;
        const cleanVar = varName.replace(suffixPattern, '');

        // Try exact match first
        if (this.responseData.has(cleanVar)) {
            return this.responseData.get(cleanVar);
        }

        // Try with underscores replaced by dots (Q1_SQ006 -> Q1.SQ006)
        const dottedVar = cleanVar.replace(/_/g, '.');
        if (this.responseData.has(dottedVar)) {
            return this.responseData.get(dottedVar);
        }

        // Try with dots replaced by underscores (Q1.SQ006 -> Q1_SQ006)
        const underscoredVar = cleanVar.replace(/\./g, '_');
        if (this.responseData.has(underscoredVar)) {
            return this.responseData.get(underscoredVar);
        }

        return undefined;
    }

    /**
     * Evaluate boolean expression using recursive descent parsing
     * Supports: ==, !=, <, >, <=, >=, AND, OR, NOT, parentheses
     */
    private evaluateBoolean(expression: string): boolean {
        const tokens = this.tokenize(expression);
        const result = this.parseOr(tokens, { pos: 0 });
        return result;
    }

    /**
     * Tokenize expression into processable tokens
     * Handles: operators, parentheses, commas, strings, numbers, identifiers
     */
    private tokenize(expression: string): string[] {
        const tokens: string[] = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = '';

        for (let i = 0; i < expression.length; i++) {
            const char = expression[i];

            if (inQuotes) {
                current += char;
                if (char === quoteChar && expression[i - 1] !== '\\') {
                    tokens.push(current);
                    current = '';
                    inQuotes = false;
                }
                continue;
            }

            if (char === '"' || char === "'") {
                if (current) {
                    tokens.push(current);
                    current = '';
                }
                inQuotes = true;
                quoteChar = char;
                current = char;
                continue;
            }

            // Handle parentheses and commas (for function args)
            if (char === '(' || char === ')' || char === ',') {
                if (current) {
                    tokens.push(current);
                    current = '';
                }
                tokens.push(char);
                continue;
            }

            if (char === ' ' || char === '\t') {
                if (current) {
                    tokens.push(current);
                    current = '';
                }
                continue;
            }

            // Handle multi-char operators
            const twoChar = expression.slice(i, i + 2);
            if (['==', '!=', '<=', '>=', '||', '&&'].includes(twoChar)) {
                if (current) {
                    tokens.push(current);
                    current = '';
                }
                // Normalize || to OR and && to AND for parser
                if (twoChar === '||') {
                    tokens.push('OR');
                } else if (twoChar === '&&') {
                    tokens.push('AND');
                } else {
                    tokens.push(twoChar);
                }
                i++; // Skip next char
                continue;
            }

            // Handle single-char operators (comparison and arithmetic)
            if ('<>=+-*/%'.includes(char)) {
                if (current) {
                    tokens.push(current);
                    current = '';
                }
                tokens.push(char);
                continue;
            }

            current += char;
        }

        if (current) {
            tokens.push(current);
        }

        return tokens;
    }

    /**
     * Parse OR expressions (lowest precedence)
     */
    private parseOr(tokens: string[], ctx: { pos: number }): boolean {
        let left = this.parseAnd(tokens, ctx);

        while (ctx.pos < tokens.length && tokens[ctx.pos] === 'OR') {
            ctx.pos++; // consume OR
            const right = this.parseAnd(tokens, ctx);
            left = left || right;
        }

        return left;
    }

    /**
     * Parse AND expressions
     */
    private parseAnd(tokens: string[], ctx: { pos: number }): boolean {
        let left = this.parseNot(tokens, ctx);

        while (ctx.pos < tokens.length && tokens[ctx.pos] === 'AND') {
            ctx.pos++; // consume AND
            const right = this.parseNot(tokens, ctx);
            left = left && right;
        }

        return left;
    }

    /**
     * Parse NOT expressions
     * Handles both 'NOT' keyword and '!' operator
     */
    private parseNot(tokens: string[], ctx: { pos: number }): boolean {
        if (ctx.pos < tokens.length && (tokens[ctx.pos] === 'NOT' || tokens[ctx.pos] === '!')) {
            ctx.pos++; // consume NOT or !
            return !this.parseNot(tokens, ctx);
        }
        return this.parseComparison(tokens, ctx);
    }

    /**
     * Parse comparison expressions
     */
    private parseComparison(tokens: string[], ctx: { pos: number }): boolean {
        const left = this.parseAddSub(tokens, ctx);

        if (ctx.pos < tokens.length) {
            const op = tokens[ctx.pos];
            if (['==', '!=', '<', '>', '<=', '>='].includes(op)) {
                ctx.pos++; // consume operator
                const right = this.parseAddSub(tokens, ctx);
                return this.evaluateComparison(left, op, right);
            }
        }

        return this.toBool(left);
    }

    /**
     * Parse addition/subtraction (lower precedence arithmetic)
     */
    private parseAddSub(tokens: string[], ctx: { pos: number }): ResponseValue {
        let left = this.parseMulDiv(tokens, ctx);

        while (ctx.pos < tokens.length && (tokens[ctx.pos] === '+' || tokens[ctx.pos] === '-')) {
            const op = tokens[ctx.pos];
            ctx.pos++; // consume operator
            const right = this.parseMulDiv(tokens, ctx);

            if (op === '+') {
                // Support string concatenation
                if (typeof left === 'string' || typeof right === 'string') {
                    left = String(left ?? '') + String(right ?? '');
                } else {
                    left = Number(left) + Number(right);
                }
            } else {
                left = Number(left) - Number(right);
            }
        }

        return left;
    }

    /**
     * Parse multiplication/division/modulo (higher precedence arithmetic)
     */
    private parseMulDiv(tokens: string[], ctx: { pos: number }): ResponseValue {
        let left = this.parseUnary(tokens, ctx);

        while (ctx.pos < tokens.length && ['*', '/', '%'].includes(tokens[ctx.pos])) {
            const op = tokens[ctx.pos];
            ctx.pos++; // consume operator
            const right = this.parseUnary(tokens, ctx);

            const leftNum = Number(left);
            const rightNum = Number(right);

            switch (op) {
                case '*':
                    left = leftNum * rightNum;
                    break;
                case '/':
                    left = rightNum !== 0 ? leftNum / rightNum : NaN;
                    break;
                case '%':
                    left = rightNum !== 0 ? leftNum % rightNum : NaN;
                    break;
            }
        }

        return left;
    }

    /**
     * Parse unary operators (negative numbers)
     */
    private parseUnary(tokens: string[], ctx: { pos: number }): ResponseValue {
        if (ctx.pos < tokens.length && tokens[ctx.pos] === '-') {
            ctx.pos++; // consume '-'
            const value = this.parseUnary(tokens, ctx);
            return -Number(value);
        }
        if (ctx.pos < tokens.length && tokens[ctx.pos] === '+') {
            ctx.pos++; // consume '+'
            return this.parseUnary(tokens, ctx);
        }
        return this.parsePrimary(tokens, ctx);
    }

    /**
     * Parse primary expressions (values, parentheses, function calls)
     */
    private parsePrimary(tokens: string[], ctx: { pos: number }): ResponseValue {
        if (ctx.pos >= tokens.length) {
            return undefined;
        }

        const token = tokens[ctx.pos];

        // Handle parentheses (grouping)
        if (token === '(') {
            ctx.pos++; // consume '('
            const result = this.parseOr(tokens, ctx);
            if (ctx.pos < tokens.length && tokens[ctx.pos] === ')') {
                ctx.pos++; // consume ')'
            }
            return result;
        }

        // Check if this is a function call: identifier followed by '('
        if (ctx.pos + 1 < tokens.length && tokens[ctx.pos + 1] === '(') {
            const funcName = token.toLowerCase();
            ctx.pos += 2; // consume function name and '('

            // Parse function arguments
            const args: ResponseValue[] = [];

            while (ctx.pos < tokens.length && tokens[ctx.pos] !== ')') {
                if (tokens[ctx.pos] === ',') {
                    ctx.pos++; // consume ','
                    continue;
                }
                const arg = this.parseAddSub(tokens, ctx);
                args.push(arg);
            }

            if (ctx.pos < tokens.length && tokens[ctx.pos] === ')') {
                ctx.pos++; // consume ')'
            }

            // Execute function
            return this.executeFunction(funcName, args);
        }

        ctx.pos++; // consume token
        return this.parseValue(token);
    }

    /**
     * Execute a built-in function
     */
    private executeFunction(name: string, args: ResponseValue[]): ResponseValue {
        const func = this.builtinFunctions.get(name);
        if (func) {
            return func(args);
        }

        console.warn(`Unknown function: ${name}`);
        return undefined;
    }

    /**
     * Evaluate comparison between two values
     */
    private evaluateComparison(left: ResponseValue, operator: string, right: ResponseValue): boolean {
        // Handle undefined comparisons
        if (left === undefined || right === undefined) {
            if (operator === '==') return left === right;
            if (operator === '!=') return left !== right;
            return false;
        }

        switch (operator) {
            case '==':
                return left == right; // Intentional == for type coercion
            case '!=':
                return left != right;
            case '<':
                return Number(left) < Number(right);
            case '>':
                return Number(left) > Number(right);
            case '<=':
                return Number(left) <= Number(right);
            case '>=':
                return Number(left) >= Number(right);
            default:
                return false;
        }
    }

    /**
     * Parse a value from string representation
     */
    private parseValue(value: string): ResponseValue {
        const trimmed = value.trim();

        // Remove quotes from strings
        if ((trimmed.startsWith("'") && trimmed.endsWith("'")) ||
            (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
            return trimmed.slice(1, -1);
        }

        // Boolean literals
        if (trimmed === 'true') return true;
        if (trimmed === 'false') return false;
        if (trimmed === 'undefined' || trimmed === 'null') return undefined;

        // Try to parse as number
        const num = parseFloat(trimmed);
        if (!isNaN(num) && isFinite(num)) {
            return num;
        }

        return trimmed;
    }

    /**
     * Convert value to boolean
     */
    private toBool(value: ResponseValue): boolean {
        if (value === undefined || value === null) return false;
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value !== 0;
        if (typeof value === 'string') return value !== '' && value !== 'false' && value !== '0';
        return Boolean(value);
    }

    /**
     * Update response data with a new Map
     */
    updateResponseData(data: Map<string, ResponseValue>): void {
        this.responseData = data;
    }

    /**
     * Set a single response value
     */
    setResponseValue(key: string, value: ResponseValue): void {
        this.responseData.set(key, value);
    }

    /**
     * Get a response value by key
     */
    getResponseValue(key: string): ResponseValue {
        return this.getVariableValue(key);
    }

    /**
     * Clear all response data
     */
    clearResponseData(): void {
        this.responseData.clear();
    }
}

/**
 * Randomization Engine for stable random selection
 */
export class RandomizationEngine {
    /**
     * Generate stable random order based on seed
     * Uses simple seeded PRNG (Mulberry32)
     */
    private seededRandom(seed: string): () => number {
        let h = 0;
        for (let i = 0; i < seed.length; i++) {
            h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
        }

        return function () {
            h = Math.imul(h ^ h >>> 16, 0x85ebca6b);
            h = Math.imul(h ^ h >>> 13, 0xc2b2ae35);
            return ((h = h ^ h >>> 16) >>> 0) / 4294967296;
        };
    }

    /**
     * Randomize array order with stable seed
     */
    randomizeArray<T>(items: T[], seed: string): T[] {
        const rng = this.seededRandom(seed);
        const shuffled = [...items];

        // Fisher-Yates shuffle with seeded RNG
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }

        return shuffled;
    }

    /**
     * Select N random items from array with stable seed
     */
    selectRandom<T>(items: T[], count: number, seed: string): T[] {
        const shuffled = this.randomizeArray(items, seed);
        return shuffled.slice(0, count);
    }

    /**
     * Generate combinations (e.g., 3 from 7 messages)
     */
    generateCombinations<T>(items: T[], size: number): T[][] {
        if (size > items.length) return [];
        if (size === items.length) return [items];
        if (size === 1) return items.map(item => [item]);

        const combinations: T[][] = [];

        for (let i = 0; i < items.length - size + 1; i++) {
            const head = items[i];
            const tailCombinations = this.generateCombinations(items.slice(i + 1), size - 1);
            for (const tail of tailCombinations) {
                combinations.push([head, ...tail]);
            }
        }

        return combinations;
    }
}
