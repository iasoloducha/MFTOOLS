(function () {
  'use strict';

  var ASCII_TO_EBCDIC = new Map();
  var EBCDIC_TO_ASCII = new Map();

  function buildTables() {
    var pairs = [
      [' ', 0x40], ['.', 0x4B], ['<', 0x4C], ['(', 0x4D], ['+', 0x4E], ['|', 0x4F],
      ['&', 0x50], ['!', 0x5A], ['$', 0x5B], ['*', 0x5C], [')', 0x5D], [';', 0x5E],
      ['-', 0x60], ['/', 0x61], [',', 0x6B], ['%', 0x6C], ['_', 0x6D], ['>', 0x6E],
      ['?', 0x6F], ['`', 0x79], [':', 0x7A], ['#', 0x7B], ['@', 0x7C], ["'", 0x7D],
      ['=', 0x7E], ['"', 0x7F], ['[', 0xBA], [']', 0xBB], ['{', 0xC0], ['}', 0xD0],
      ['\\', 0xE0], ['^', 0xB0], ['~', 0xA1]
    ];

    for (var digit = 0; digit <= 9; digit++) {
      pairs.push([String(digit), 0xF0 + digit]);
    }

    var upperGroups = [[0xC1, 65, 9], [0xD1, 74, 9], [0xE2, 83, 8]];
    upperGroups.forEach(function (group) {
      for (var i = 0; i < group[2]; i++) {
        pairs.push([String.fromCharCode(group[1] + i), group[0] + i]);
      }
    });

    var lowerGroups = [[0x81, 97, 9], [0x91, 106, 9], [0xA2, 115, 8]];
    lowerGroups.forEach(function (group) {
      for (var j = 0; j < group[2]; j++) {
        pairs.push([String.fromCharCode(group[1] + j), group[0] + j]);
      }
    });

    pairs.forEach(function (pair) {
      ASCII_TO_EBCDIC.set(pair[0], pair[1]);
      EBCDIC_TO_ASCII.set(pair[1], pair[0]);
    });
  }

  function hex2(byte) {
    return byte.toString(16).toUpperCase().padStart(2, '0');
  }

  function parseHex(text) {
    var normalized = text.replace(/0x/gi, ' ');
    var trimmed = normalized.trim();
    if (!trimmed) return [];

    var tokens = trimmed.split(/[\s,]+/).filter(Boolean);
    var isByteList = tokens.length > 0 && tokens.every(function (token) {
      return /^[0-9a-fA-F]{1,2}$/.test(token);
    });

    var bytes = [];
    if (isByteList) {
      tokens.forEach(function (token) {
        bytes.push(parseInt(token.length === 1 ? '0' + token : token, 16));
      });
      return bytes;
    }

    var clean = normalized.replace(/[^0-9a-fA-F]/g, '');
    if (clean.length % 2 !== 0) clean = clean.slice(0, -1);
    for (var i = 0; i < clean.length; i += 2) {
      bytes.push(parseInt(clean.substr(i, 2), 16));
    }
    return bytes;
  }

  function parseTextAsBytes(text) {
    var bytes = [];
    for (var i = 0; i < text.length; i++) {
      var code = text.charCodeAt(i);
      bytes.push(code <= 0xFF ? code : 0x6F);
    }
    return bytes;
  }

  // EBCDIC text pasted from a 3270 view: each character is one byte, and a
  // displayed space is the EBCDIC space (0x40), not the ASCII space (0x20).
  function parseEbcdicText(text) {
    var bytes = [];
    for (var i = 0; i < text.length; i++) {
      var code = text.charCodeAt(i);
      if (code === 0x20) code = 0x40;
      else if (code === 0x0A) code = 0x25;
      else if (code === 0x09) code = 0x05;
      bytes.push(code <= 0xFF ? code : 0x6F);
    }
    return bytes;
  }

  function asciiToEbcdic(text) {
    var bytes = [];
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      if (ch === '\n') { bytes.push(0x25); continue; }
      if (ch === '\r') { bytes.push(0x0D); continue; }
      if (ch === '\t') { bytes.push(0x05); continue; }
      var byte = ASCII_TO_EBCDIC.get(ch);
      bytes.push(byte === undefined ? 0x6F : byte);
    }
    return bytes;
  }

  function ebcdicChar(byte) {
    var ch = EBCDIC_TO_ASCII.get(byte);
    if (ch === ' ') return ' ';
    if (ch === undefined) return '.';
    return ch;
  }

  function asciiChar(byte) {
    return byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.';
  }

  function hexDump(bytes, resolve) {
    if (!bytes.length) return '';
    var lines = [];
    for (var offset = 0; offset < bytes.length; offset += 16) {
      var slice = bytes.slice(offset, offset + 16);
      var cells = [];
      for (var i = 0; i < 16; i++) {
        cells.push(i < slice.length ? hex2(slice[i]) : '  ');
      }
      var chars = slice.map(function (byte) { return resolve(byte); }).join('');
      lines.push(offset.toString(16).toUpperCase().padStart(6, '0') + '  ' +
        cells.join(' ') + '  |' + chars + '|');
    }
    return lines.join('\n');
  }

  buildTables();

  function renderMap() {
    var grid = document.getElementById('map-grid');
    if (!grid) return;

    var entries = [];
    ASCII_TO_EBCDIC.forEach(function (byte, ch) {
      entries.push([byte, ch]);
    });
    entries.sort(function (a, b) { return a[0] - b[0]; });

    var fragment = document.createDocumentFragment();
    entries.forEach(function (entry) {
      var cell = document.createElement('div');
      cell.className = 'map-cell';

      var chSpan = document.createElement('span');
      chSpan.className = 'ch';
      chSpan.textContent = entry[1] === ' ' ? 'SP' : entry[1];

      var hexSpan = document.createElement('span');
      hexSpan.className = 'hx';
      hexSpan.textContent = hex2(entry[0]);

      cell.appendChild(chSpan);
      cell.appendChild(hexSpan);
      fragment.appendChild(cell);
    });

    grid.appendChild(fragment);
  }

  function init() {
    var input = document.getElementById('input');
    var output = document.getElementById('output');
    var inputDump = document.getElementById('input-dump');
    var inputHelp = document.getElementById('input-help');
    var outputHelp = document.getElementById('output-help');
    var inputTitle = document.getElementById('input-title');
    var outputTitle = document.getElementById('output-title');
    var formatField = document.getElementById('format-field');
    var formatSelect = document.getElementById('input-format');
    var dirE2A = document.getElementById('dir-e2a');
    var dirA2E = document.getElementById('dir-a2e');
    var swapBtn = document.getElementById('btn-swap');
    var clearBtn = document.getElementById('btn-clear');
    var copyBtn = document.getElementById('btn-copy');

    if (!input || !output) return;

    var direction = 'e2a';
    var inputFormat = 'hex';

    function syncChrome() {
      var isE2A = direction === 'e2a';
      dirE2A.setAttribute('aria-pressed', String(isE2A));
      dirA2E.setAttribute('aria-pressed', String(!isE2A));
      formatField.hidden = !isE2A;

      if (isE2A) {
        inputTitle.textContent = 'EBCDIC input';
        outputTitle.textContent = 'ASCII output';
        input.placeholder = inputFormat === 'hex'
          ? 'EBCDIC hex bytes, e.g. 40 C1 C2 C3'
          : 'EBCDIC text as displayed, e.g. \u00a9\u00c1\u00c2\u00c3';
        output.placeholder = 'ASCII output appears here…';
      } else {
        inputTitle.textContent = 'ASCII input';
        outputTitle.textContent = 'EBCDIC output (hex)';
        input.placeholder = 'Type ASCII text, e.g. HELLO';
        output.placeholder = 'EBCDIC hex output appears here…';
      }
    }

    function convert() {
      var text = input.value;
      var bytes;

      if (direction === 'e2a') {
        bytes = inputFormat === 'hex' ? parseHex(text) : parseEbcdicText(text);

        output.value = bytes.map(function (byte) {
          var ch = EBCDIC_TO_ASCII.get(byte);
          return ch === undefined ? '\u00b7' : ch;
        }).join('');

        inputDump.textContent = hexDump(bytes, ebcdicChar);
        inputDump.hidden = bytes.length === 0;
        inputHelp.textContent = bytes.length + ' byte(s) parsed from EBCDIC input.';
        outputHelp.textContent = 'CP037 · bytes with no printable mapping appear as ·.';
      } else {
        bytes = asciiToEbcdic(text);

        output.value = bytes.map(hex2).join(' ');
        inputDump.textContent = hexDump(parseTextAsBytes(text), asciiChar);
        inputDump.hidden = text.length === 0;
        inputHelp.textContent = text.length + ' character(s) in ASCII input.';
        outputHelp.textContent = 'CP037 hex bytes · unmapped characters become 6F (?).';
      }
    }

    function setDirection(next) {
      direction = next;
      syncChrome();
      convert();
    }

    dirE2A.addEventListener('click', function () { setDirection('e2a'); });
    dirA2E.addEventListener('click', function () { setDirection('a2e'); });

    formatSelect.addEventListener('change', function () {
      inputFormat = formatSelect.value;
      syncChrome();
      convert();
    });

    input.addEventListener('input', convert);

    swapBtn.addEventListener('click', function () {
      var previousOutput = output.value;
      if (direction === 'e2a') {
        direction = 'a2e';
      } else {
        direction = 'e2a';
        inputFormat = 'hex';
        formatSelect.value = 'hex';
      }
      input.value = previousOutput;
      syncChrome();
      convert();
      input.focus();
    });

    clearBtn.addEventListener('click', function () {
      input.value = '';
      convert();
      input.focus();
    });

    function fallbackCopy(value) {
      var temp = document.createElement('textarea');
      temp.value = value;
      temp.style.position = 'fixed';
      temp.style.top = '-1000px';
      temp.style.opacity = '0';
      document.body.appendChild(temp);
      temp.select();
      try { document.execCommand('copy'); } catch (error) { /* ignore */ }
      document.body.removeChild(temp);
    }

    copyBtn.addEventListener('click', function () {
      var value = output.value;
      var original = copyBtn.textContent;

      function done() {
        copyBtn.textContent = 'Copied';
        window.setTimeout(function () { copyBtn.textContent = original; }, 1200);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(done, function () {
          fallbackCopy(value);
          done();
        });
      } else {
        fallbackCopy(value);
        done();
      }
    });

    syncChrome();
    convert();
    renderMap();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      ASCII_TO_EBCDIC: ASCII_TO_EBCDIC,
      EBCDIC_TO_ASCII: EBCDIC_TO_ASCII,
      parseHex: parseHex,
      asciiToEbcdic: asciiToEbcdic,
      hexDump: hexDump
    };
  }
})();
