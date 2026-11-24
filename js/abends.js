(function () {
  'use strict';

  var ABENDS = [
    {
      code: 'S0C1', type: 'Program', meaning: 'Operation exception',
      cause: 'Invalid or unknown instruction; corrupted code, a bad branch, or wrong CALL linkage.',
      action: 'Inspect the dump and PSW; verify CALL parameters and check for storage overlay.'
    },
    {
      code: 'S0C2', type: 'Program', meaning: 'Privileged operation exception',
      cause: 'A program attempted to execute a privileged instruction in problem state.',
      action: 'Check for corrupted code or storage overlay.'
    },
    {
      code: 'S0C3', type: 'Program', meaning: 'Execute exception',
      cause: 'An EXECUTE was attempted on an instruction at an invalid address.',
      action: 'Verify addressability of the target instruction.'
    },
    {
      code: 'S0C4', type: 'Program', meaning: 'Protection exception (storage violation)',
      cause: 'Reference outside the program storage: bad subscript, uninitialized pointer, table overrun.',
      action: 'Find the failing address in the dump; check OCCURS, subscripts and pointers.'
    },
    {
      code: 'S0C5', type: 'Program', meaning: 'Addressing exception',
      cause: 'Reference to an address that is not valid or not available to the program.',
      action: 'Check address arithmetic and 24/31-bit addressing.'
    },
    {
      code: 'S0C6', type: 'Program', meaning: 'Specification exception',
      cause: 'Operand not on a required boundary or not valid for the instruction.',
      action: 'Check field alignment and numeric field definitions.'
    },
    {
      code: 'S0C7', type: 'Program', meaning: 'Data exception',
      cause: 'Non-numeric data in a numeric field (packed or zoned decimal).',
      action: 'Locate the bad field in the dump; validate input and initialize WORKING-STORAGE.'
    },
    {
      code: 'S0C8', type: 'Program', meaning: 'Fixed-point overflow',
      cause: 'Binary (COMP) arithmetic result does not fit the field.',
      action: 'Size COMP and COMP-3 fields to hold the largest possible result.'
    },
    {
      code: 'S0C9', type: 'Program', meaning: 'Fixed-point divide exception',
      cause: 'Division by zero in binary arithmetic.',
      action: 'Guard divisors before dividing; check COMP fields.'
    },
    {
      code: 'S0CA', type: 'Program', meaning: 'Decimal overflow',
      cause: 'Decimal arithmetic result exceeds the PICTURE size.',
      action: 'Widen the receiving field or truncate before the operation.'
    },
    {
      code: 'S0CB', type: 'Program', meaning: 'Decimal divide exception',
      cause: 'Division by zero in decimal arithmetic.',
      action: 'Guard divisors before DIVIDE.'
    },
    {
      code: 'S0CC', type: 'Program', meaning: 'Exponent overflow',
      cause: 'Floating-point overflow in COMP-1 or COMP-2 data.',
      action: 'Check input magnitudes and floating-point usage.'
    },
    {
      code: 'S0CD', type: 'Program', meaning: 'Exponent underflow',
      cause: 'Floating-point underflow in COMP-1 or COMP-2 data.',
      action: 'Check the numeric logic and field usage.'
    },
    {
      code: 'S0CE', type: 'Program', meaning: 'Significance exception',
      cause: 'A floating-point result lost significance.',
      action: 'Usually benign; review the numeric logic.'
    },
    {
      code: 'S0CF', type: 'Program', meaning: 'Floating-point divide exception',
      cause: 'Division by zero in floating-point arithmetic.',
      action: 'Guard divisors before dividing.'
    },
    {
      code: 'S013', type: 'JCL/Dataset', meaning: 'OPEN failure',
      cause: 'A required dataset could not be opened: missing DD, not cataloged, wrong DISP, or security.',
      action: 'Read the IEC141I / IEC143I message; fix the DD/JCL or catalog the dataset.'
    },
    {
      code: 'S013-xx', type: 'JCL/Dataset', meaning: 'OPEN failure with reason code',
      cause: 'The xx suffix identifies the specific open failure reason.',
      action: 'Match the suffix against the accompanying IEC message before changing the JCL.'
    },
    {
      code: 'S213', type: 'JCL/Dataset', meaning: 'Dataset open or close error',
      cause: 'Error opening or closing a dataset; details are in IEC030I or IEC031I.',
      action: 'Check the DD name, DSN, volume and DISP.'
    },
    {
      code: 'S213-xx', type: 'JCL/Dataset', meaning: 'Dataset open/close error with reason code',
      cause: 'The xx suffix identifies the specific dataset error.',
      action: 'Read the IEC message and correct the DD or dataset.'
    },
    {
      code: 'JCL ERROR', type: 'JCL/Dataset', meaning: 'Job not executed',
      cause: 'JCL syntax or statement error; the job never started.',
      action: 'Read the JES job log and run the JCL through a checker.'
    },
    {
      code: 'SB14', type: 'Storage', meaning: 'Insufficient virtual storage',
      cause: 'Not enough region or virtual storage to run the step.',
      action: 'Increase REGION or reduce storage usage.'
    },
    {
      code: 'SB37', type: 'Storage', meaning: 'Out of space (DASD)',
      cause: 'A dataset ran out of space on direct-access storage.',
      action: 'Add primary/secondary space, free space, or add volumes.'
    },
    {
      code: 'SD37', type: 'Storage', meaning: 'Out of space (DASD)',
      cause: 'Secondary allocation could not be satisfied.',
      action: 'Increase secondary space or free space on the volume.'
    },
    {
      code: 'SE37', type: 'Storage', meaning: 'Out of space (DASD)',
      cause: 'Space is not available on the requested volume.',
      action: 'Free or add space, or redirect the allocation.'
    },
    {
      code: 'S878', type: 'Storage', meaning: 'Insufficient storage to complete request',
      cause: 'Region or address space storage exhausted.',
      action: 'Increase REGION or reduce storage usage.'
    },
    {
      code: 'S913', type: 'Security', meaning: 'Insufficient authority',
      cause: 'RACF, ACF2 or Top Secret denied access to a resource.',
      action: 'Review the security profile and the user or job access.'
    },
    {
      code: 'S222', type: 'System', meaning: 'Job or step cancelled',
      cause: 'Cancelled by an operator command or JES.',
      action: 'Confirm with operations and check the JES log.'
    },
    {
      code: 'S322', type: 'System', meaning: 'CPU time limit exceeded',
      cause: 'The step used more CPU time than allowed by TIME=.',
      action: 'Increase TIME= or optimize the program.'
    },
    {
      code: 'S522', type: 'System', meaning: 'Job wait time exceeded',
      cause: 'The job waited longer than the configured limit, often on a device or operator action.',
      action: 'Check for device contention or pending mounts; adjust the time limits.'
    },
    {
      code: 'S806', type: 'System', meaning: 'Module not found',
      cause: 'The requested program or module could not be loaded from STEPLIB, JOBLIB or the linklist.',
      action: 'Verify the program name and the library concatenation.'
    },
    {
      code: 'U0001–U4095', type: 'User', meaning: 'User abend',
      cause: 'The application issued a user abend, for example through an abend routine or an unhandled condition.',
      action: 'Check the program abend logic and the job messages.'
    },
    {
      code: 'U0100', type: 'User', meaning: 'User abend 100',
      cause: 'Frequently raised by application code as a custom error.',
      action: 'Check the application log and the code that issues the abend.'
    },
    {
      code: 'U1000', type: 'User', meaning: 'User abend 1000',
      cause: 'Custom application abend code.',
      action: 'Check the application log and the code that issues the abend.'
    },
    {
      code: 'U4038', type: 'User', meaning: 'Language Environment unhandled condition',
      cause: 'LE terminated the program because a condition was not handled.',
      action: 'Review the CEEDUMP and messages, then add condition handling.'
    }
  ];

  function matchesItem(item, type, query) {
    if (type !== 'all' && item.type !== type) return false;
    if (!query) return true;
    var haystack = (item.code + ' ' + item.type + ' ' + item.meaning + ' ' +
      item.cause + ' ' + item.action).toLowerCase();
    return haystack.indexOf(query) !== -1;
  }

  function init() {
    var bodyEl = document.getElementById('abend-body');
    var searchEl = document.getElementById('abend-search');
    var chipsEl = document.getElementById('abend-chips');
    var countEl = document.getElementById('abend-count');
    var emptyEl = document.getElementById('abend-empty');
    if (!bodyEl || !searchEl || !chipsEl || !countEl || !emptyEl) return;

    var activeType = 'all';
    var query = '';

    function tagClass(type) {
      if (type === 'User') return 'tag tag-user';
      if (type === 'Security') return 'tag tag-security';
      if (type === 'JCL/Dataset') return 'tag tag-jcl';
      return 'tag';
    }

    function cell(text, className) {
      var td = document.createElement('td');
      if (className) td.className = className;
      td.textContent = text;
      return td;
    }

    function render() {
      bodyEl.textContent = '';
      var visible = 0;

      ABENDS.forEach(function (item) {
        if (!matchesItem(item, activeType, query)) return;
        visible += 1;

        var tr = document.createElement('tr');

        tr.appendChild(cell(item.code, 'code-cell'));

        var typeTd = document.createElement('td');
        var tag = document.createElement('span');
        tag.className = tagClass(item.type);
        tag.textContent = item.type;
        typeTd.appendChild(tag);
        tr.appendChild(typeTd);

        tr.appendChild(cell(item.meaning));
        tr.appendChild(cell(item.cause));
        tr.appendChild(cell(item.action));

        bodyEl.appendChild(tr);
      });

      countEl.textContent = visible + ' / ' + ABENDS.length;
      emptyEl.hidden = visible !== 0;
    }

    searchEl.addEventListener('input', function () {
      query = searchEl.value.trim().toLowerCase();
      render();
    });

    chipsEl.addEventListener('click', function (event) {
      var chip = event.target.closest('.chip');
      if (!chip) return;
      activeType = chip.dataset.type;
      Array.prototype.forEach.call(chipsEl.querySelectorAll('.chip'), function (button) {
        button.setAttribute('aria-pressed', button === chip ? 'true' : 'false');
      });
      render();
    });

    render();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ABENDS: ABENDS, matchesItem: matchesItem };
  }
})();
