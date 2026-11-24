(function () {
  'use strict';

  var displayEl = document.getElementById('calc-display');
  var historyEl = document.getElementById('calc-history');
  var keysEl = document.getElementById('calc-keys');
  if (!displayEl || !historyEl || !keysEl) return;

  var MAX_DIGITS = 16;

  var state = {
    display: '0',
    acc: null,
    op: null,
    fresh: true,
    lastOp: null,
    lastOperand: null
  };

  function opSymbol(op) {
    return { '+': '+', '-': '−', '*': '×', '/': '÷' }[op] || op;
  }

  function formatValue(value) {
    if (typeof value !== 'number' || !isFinite(value)) return 'Error';
    var rounded = Number.parseFloat(value.toPrecision(12));
    var text = String(rounded);
    if (text.length > 18) text = rounded.toExponential(8);
    return text;
  }

  function render() {
    displayEl.textContent = state.display;
    if (state.op !== null && state.acc !== null) {
      historyEl.textContent = formatValue(state.acc) + ' ' + opSymbol(state.op);
    } else {
      historyEl.textContent = '';
    }
  }

  function compute(a, b, op) {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return b === 0 ? NaN : a / b;
      default: return b;
    }
  }

  function reset() {
    state.display = '0';
    state.acc = null;
    state.op = null;
    state.fresh = true;
    state.lastOp = null;
    state.lastOperand = null;
  }

  function inputDigit(digit) {
    if (state.display === 'Error') reset();
    if (state.fresh) {
      state.display = digit;
      state.fresh = false;
    } else if (state.display === '0') {
      state.display = digit;
    } else if (state.display.replace(/[^0-9]/g, '').length < MAX_DIGITS) {
      state.display += digit;
    }
    render();
  }

  function inputDot() {
    if (state.display === 'Error') reset();
    if (state.fresh) {
      state.display = '0.';
      state.fresh = false;
    } else if (state.display.indexOf('.') === -1) {
      state.display += '.';
    }
    render();
  }

  function chooseOperator(op) {
    var value = parseFloat(state.display);
    if (!isFinite(value)) {
      reset();
      render();
      return;
    }

    if (state.op !== null && !state.fresh) {
      var result = compute(state.acc, value, state.op);
      state.acc = result;
      state.display = formatValue(result);
      if (state.display === 'Error') {
        state.acc = null;
        state.op = null;
        state.fresh = true;
        render();
        return;
      }
    } else {
      state.acc = value;
    }

    state.op = op;
    state.fresh = true;
    state.lastOp = null;
    state.lastOperand = null;
    render();
  }

  function equals() {
    if (state.op !== null) {
      var a = state.acc;
      var b = parseFloat(state.display);
      if (a === null || !isFinite(b)) {
        reset();
        render();
        return;
      }
      var result = compute(a, b, state.op);
      state.lastOp = state.op;
      state.lastOperand = b;
      state.display = formatValue(result);
      state.acc = null;
      state.op = null;
      state.fresh = true;
      if (state.display === 'Error') {
        state.lastOp = null;
        state.lastOperand = null;
      }
      render();
      return;
    }

    if (state.lastOp !== null && state.lastOperand !== null) {
      var current = parseFloat(state.display);
      if (!isFinite(current)) return;
      var next = compute(current, state.lastOperand, state.lastOp);
      state.display = formatValue(next);
      state.fresh = true;
      if (state.display === 'Error') {
        state.lastOp = null;
        state.lastOperand = null;
      }
      render();
    }
  }

  function percent() {
    var value = parseFloat(state.display);
    if (!isFinite(value)) return;
    var result;
    if (state.op !== null && state.acc !== null) {
      result = state.acc * value / 100;
    } else {
      result = value / 100;
    }
    state.display = formatValue(result);
    state.fresh = false;
    render();
  }

  function toggleSign() {
    if (state.display === 'Error' || state.display === '0') return;
    state.display = state.display.charAt(0) === '-'
      ? state.display.slice(1)
      : '-' + state.display;
    render();
  }

  function backspace() {
    if (state.fresh || state.display === 'Error') return;
    state.display = state.display.length > 1 ? state.display.slice(0, -1) : '0';
    if (state.display === '-') state.display = '0';
    render();
  }

  function handleAction(action) {
    switch (action) {
      case 'clear': reset(); break;
      case 'sign': toggleSign(); break;
      case 'percent': percent(); break;
      case 'dot': inputDot(); break;
      case 'equals': equals(); break;
      case 'backspace': backspace(); break;
    }
    render();
  }

  keysEl.addEventListener('click', function (event) {
    var button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.digit !== undefined) {
      inputDigit(button.dataset.digit);
    } else if (button.dataset.op) {
      chooseOperator(button.dataset.op);
    } else if (button.dataset.action) {
      handleAction(button.dataset.action);
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    var key = event.key;

    if (/^[0-9]$/.test(key)) {
      inputDigit(key);
    } else if (key === '.') {
      inputDot();
    } else if (key === '+' || key === '-' || key === '*' || key === '/') {
      chooseOperator(key);
    } else if (key === 'Enter' || key === '=') {
      equals();
    } else if (key === 'Backspace') {
      backspace();
    } else if (key === 'Escape') {
      reset();
      render();
    } else if (key === '%') {
      percent();
    } else {
      return;
    }
    event.preventDefault();
  });

  render();
})();
