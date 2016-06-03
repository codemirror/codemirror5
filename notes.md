# Features to Test

### Testing ContentEditable
**IN PROGRESS**
&#x1F535;

Details in
https://docs.google.com/spreadsheets/d/1VWlJQrEKwQFvZjXJrPiOWz59Sanv9eK58RRvbo1e83A/edit#gid=0

Can be set using inputStyle: "contenteditable"

**NOTE** Typing is not read out in this mode

**FIX** Add contenteditable="true" to the parent class containing the code - class='CodeMirror-lines' - app.js

    document.getElementsByClassName('CodeMirror-lines')[0].contentEditable = true;

**NOTE** This causes the code not to compile completely , reverted the change for now.

**TO DO** Test contenteditable against various browsers. (check for standard list in W3C)


### Including vi
**DONE**
&#x2705;

Code for this is present in index.html


    <script src="keymap/vim.js"></script>

    var myCodeMirror = CodeMirror(document.body, {
      value: "console.log('potato')",
      mode:  "javascript",
      lineNumbers: true,
      keyMap: 'vim'
    });


### Helpful coding features
**IN PROGRESS**
&#x1F535;

Including simple functionalities (**How does it work with VO??**)
* auto indenting
  * already true
  * **NOTE** VO does not announce it.
* complete the brackets
  * add *addon/edit/closebrackets.js*
  * set *autoCloseBrackets: true*
  * **ISSUE:** VO does not read the brackets out loud if this used



### Changing the font size
**DONE**
&#x2705;

A select menu is added to include options for font sizes ranging from 6px to 72px. It has an onchange event listener which calls the following function:

    <select id="fontSize">
        <option value="6px">6px</option>
        <option value="7px">7px</option>
        <option value="8px">8px</option>
        <!-- etc -->
    </select>

    var cmWrapperElement = myCodeMirror.getWrapperElement();

    function setFontSize() {
        var fontSize = document.getElementById('fontSize').value;
        cmWrapperElement.style['font-size'] = value;
    }

This then renders an inline style attribute to the parent element:

    <div class="CodeMirror" style="font-size: //fontSize;">
        <!-- etc -->
    </div>

Theoretically, any CSS attribute could be set in this fashion by the user; furthermore, any custom styles could easily be stashed in the browser's localStorage or written to a CSS file and saved in server-side user account preferences.

### Getting the line position
**TODO**
&#x1F534;

myCodeMirror.doc.getCursor() gives the line and column(?) number


### Getting total number of lines
**DONE-ISH**
&#x1F535;

    <div id="noOfLines" aria-live="assertive" > no Of lines - 10 </div>

    myCodeMirror.setOption("extraKeys", {
      'Ctrl-L': function(cm) {
        document.getElementById('noOfLines').innerHTML = 'no of lines - ' + myCodeMirror.lineCount();
      }
    });

### Adding different themes
**DONE**
&#x2705;

To test, have added a button to toggle between 2 themes

**app.js**

    function toggleTheme() {
      if(isLightTheme == 1) {
        myCodeMirror.setOption('theme','blackboard');
        isLightTheme = 0;
      }
      else {
        myCodeMirror.setOption('theme','default');
        isLightTheme = 1;
      }
    }
